import { CHANNELS, type Channel } from '../src/lib/channels';
import { providerRefOf } from '../src/lib/providers/index';
import { fetchProgramsForChannels } from '../src/lib/sync';
import { pruneD1, writeDayToD1, type D1Db } from '../src/lib/store';

interface CronEnv {
  DB: D1Db;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_API_KEY?: string;
  CRON_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  BOT_WEBHOOK_SECRET?: string;
  ALLOWED_USER_IDS?: string;
}

/** WIB YYYY-MM-DD (duplikat kecil agar worker tidak menarik seluruh epg.ts). */
function todayWIB(date = new Date()): string {
  return new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000)
    .toISOString()
    .slice(0, 10);
}
function addDays(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T12:00:00+07:00`);
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() + (7 * 60 + d.getTimezoneOffset()) * 60000).toISOString().slice(0, 10);
}

/**
 * Cloudflare Worker membatasi subrequest (~50/invocation). Karena ada ~104 channel,
 * tiap cron hanya fetch SATU shard (8 channel) agar tidak lewat batas.
 * Rotasi shard per slot 20 menit → semua channel lengkap dalam ~2,7 jam.
 */
const SHARD_SIZE = 8;
const FETCHABLE = CHANNELS.filter((c) => providerRefOf(c) !== '');
const SHARDS = Math.ceil(FETCHABLE.length / SHARD_SIZE);

function shardFor(nowMs: number): Channel[] {
  const slot = Math.floor(nowMs / (20 * 60 * 1000));
  const i = slot % SHARDS;
  return FETCHABLE.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE);
}

async function syncShardDate(env: CronEnv, date: string, shard: Channel[]): Promise<{ date: string; count: number }> {
  const programs = await fetchProgramsForChannels(env, date, shard);
  await writeDayToD1(env.DB, date, programs);
  return { date, count: programs.length };
}

/** Offset tanggal arsip/masa depan yang dirotasi (di luar hari ini & besok). */
const ROTATE_OFFSETS = [-3, -2, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// --- Bot Telegram: kelola daftar channel via command di topic grup ---
const BOT_CHAT = -1003974729570;
const BOT_TOPIC = 394;

const DEFAULT_CHANNELS = [
  'animax',
  'aniplus',
  'hbo',
  'hbo-hits',
  'hbo-family',
  'hbo-signature',
  'nickelodeon',
  'nickelodeon-jr',
  'dreamworks',
  'cbeebies',
  'rock-action',
  'galaxy-premium',
  'imc',
  'vision-prime',
  'mentari-tv',
  'rtv',
  'trans7',
  'trans-tv',
  'mnctv',
  'rcti',
  'gtv',
  'antv',
];

async function tgFetch(env: CronEnv, method: string, body: unknown): Promise<{ ok: boolean; [k: string]: unknown }> {
  if (!env.TELEGRAM_BOT_TOKEN) return { ok: false };
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; [k: string]: unknown };
}

async function readTelegramRow(env: CronEnv): Promise<{ slugs: string[]; admins: number[] } | null> {
  if (!env.DB) return null;
  const row = (await (env.DB.prepare(
    'SELECT channels, admins FROM telegram_channels WHERE chat_id = ?1 AND message_thread_id = ?2',
  )
    .bind(BOT_CHAT, BOT_TOPIC) as any)
    .first()) as { channels: string; admins: string | null } | null;
  if (!row?.channels) return null;
  try {
    const parsed = JSON.parse(row.channels) as unknown;
    const admins = row.admins ? ((JSON.parse(row.admins) as unknown) as number[]) : [];
    if (!Array.isArray(parsed)) return null;
    return { slugs: parsed as string[], admins: Array.isArray(admins) ? admins : [] };
  } catch {
    return null;
  }
}

async function readTelegramChannels(env: CronEnv): Promise<string[]> {
  const row = await readTelegramRow(env);
  if (row?.slugs && row.slugs.length > 0) return row.slugs;
  return DEFAULT_CHANNELS;
}

async function writeTelegramRow(env: CronEnv, slugs: string[], admins?: number[]): Promise<void> {
  const row = await readTelegramRow(env);
  const nextAdmins = admins ?? row?.admins ?? [];
  await env.DB.prepare(
    'INSERT INTO telegram_channels (chat_id, message_thread_id, channels, admins, updated_at) VALUES (?1, ?2, ?3, ?4, ?5) ' +
      'ON CONFLICT(chat_id, message_thread_id) DO UPDATE SET channels = ?3, admins = ?4, updated_at = ?5',
  )
    .bind(BOT_CHAT, BOT_TOPIC, JSON.stringify(slugs), JSON.stringify(nextAdmins), new Date().toISOString())
    .run();
}

function channelNames(slugs: string[]): string {
  const bySlug = new Map(CHANNELS.map((c) => [c.slug, c.name]));
  return slugs.map((s) => `${bySlug.get(s) ?? s} (\`${s}\`)`).join(', ') || '(kosong)';
}

function splitArgs(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function checkIsAdmin(env: CronEnv, userId: number): Promise<boolean> {
  if (env.ALLOWED_USER_IDS) {
    const allowed = new Set(env.ALLOWED_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean).map(Number));
    if (allowed.has(userId)) return true;
  }
  // Verifikasi apakah user adalah admin grup Telegram via getChatMember
  try {
    const res = await tgFetch(env, 'getChatMember', { chat_id: BOT_CHAT, user_id: userId });
    if (res.ok && res.result) {
      const status = (res.result as { status?: string }).status;
      if (status === 'creator' || status === 'administrator') return true;
    }
  } catch {}

  // Fallback: periksa list admin di D1
  const row = await readTelegramRow(env);
  if (row?.admins && row.admins.includes(userId)) return true;
  if (!row?.admins || row.admins.length === 0) {
    await writeTelegramRow(env, row?.slugs ?? DEFAULT_CHANNELS, [userId]);
    return true;
  }
  return false;
}

async function registerBotCommands(env: CronEnv): Promise<boolean> {
  const commands = [
    { command: 'list', description: 'Lihat daftar channel EPG' },
    { command: 'add', description: 'Tambah channel (contoh: /add rcti,gtv)' },
    { command: 'remove', description: 'Hapus channel (contoh: /remove rcti)' },
    { command: 'help', description: 'Panduan penggunaan bot EPG' },
  ];
  const r1 = await tgFetch(env, 'setMyCommands', { commands });
  const r2 = await tgFetch(env, 'setMyCommands', {
    commands,
    scope: { type: 'chat', chat_id: BOT_CHAT },
  });
  return r1.ok || r2.ok;
}

async function handleCommand(
  env: CronEnv,
  text: string,
  replyTo?: number,
  fromId?: number,
  threadId: number = BOT_TOPIC,
): Promise<boolean> {
  const [cmdRaw, ...restRaw] = text.split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, '');
  const rest = restRaw.join(' ').trim();
  const known = new Set(CHANNELS.map((c) => c.slug));

  const reply = async (line: string) => {
    const body: Record<string, unknown> = {
      chat_id: BOT_CHAT,
      message_thread_id: threadId,
      text: line,
      parse_mode: 'Markdown',
    };
    if (replyTo) body.reply_to_message_id = replyTo;
    await tgFetch(env, 'sendMessage', body);
  };

  // Jika dipanggil di luar topik target EPG
  if (threadId !== BOT_TOPIC) {
    if (['/list', '/add', '/remove', '/help', '/setmenu'].includes(cmd)) {
      await reply('⚠️ Bot EPG hanya dapat digunakan di topik khusus EPG.');
      return true;
    }
    return false;
  }

  if (cmd === '/list') {
    const cur = await readTelegramChannels(env);
    await reply(`📋 *Channel bot (${cur.length}):*\n${channelNames(cur)}\n\n➕ Menambah: \`/add rcti,gtv\`\n➖ Menghapus: \`/remove rcti\``);
    return true;
  }

  if (cmd === '/add' || cmd === '/remove') {
    if (fromId !== undefined) {
      const isAdmin = await checkIsAdmin(env, fromId);
      if (!isAdmin) {
        await reply('⛔ Hanya admin grup yang dapat menambah atau menghapus channel.');
        return true;
      }
    }

    const slugs = splitArgs(rest);
    if (!slugs.length) {
      await reply(cmd === '/add' ? 'Contoh: `/add rcti,trans7,gtv`' : 'Contoh: `/remove trans7`');
      return true;
    }
    const bad = slugs.filter((s) => !known.has(s));
    const good = slugs.filter((s) => known.has(s));
    const cur = await readTelegramChannels(env);
    let next: string[];
    if (cmd === '/add') {
      next = [...cur, ...good.filter((s) => !cur.includes(s))];
    } else {
      next = cur.filter((s) => !good.includes(s));
    }
    await writeTelegramRow(env, next);
    const notes = [
      `${cmd === '/add' ? '✅ *Ditambah*:' : '🗑️ *Dihapus*:'} ${channelNames(good) || '(tidak ada)'}`,
      bad.length ? `❓ *Tidak dikenal*: ${bad.join(', ')}` : null,
      `📋 *Daftar kini (${next.length}):*\n${channelNames(next)}`,
    ];
    await reply(notes.filter(Boolean).join('\n\n'));
    return true;
  }

  if (cmd === '/help') {
    await reply(
      '🤖 *Panduan Bot EPG Haru*\n\n' +
        '• `/list` - Menampilkan channel aktif\n' +
        '• `/add <slug>` - Menambah channel (Admin)\n' +
        '• `/remove <slug>` - Menghapus channel (Admin)\n' +
        '• `/setmenu` - Perbarui menu tombol bot di grup\n\n' +
        '💡 _Jadwal harian diposting otomatis setiap jam 00:30 WIB._',
    );
    return true;
  }

  if (cmd === '/setmenu') {
    if (fromId !== undefined) {
      const isAdmin = await checkIsAdmin(env, fromId);
      if (!isAdmin) {
        await reply('⛔ Hanya admin yang dapat mengatur menu bot.');
        return true;
      }
    }
    const ok = await registerBotCommands(env);
    await reply(ok ? '✅ Menu tombol bot berhasil diperbarui di grup!' : '❌ Gagal mendaftarkan menu bot ke Telegram.');
    return true;
  }

  return false;
}

async function handleTelegramUpdate(env: CronEnv, update: Record<string, unknown>): Promise<void> {
  const msg = (update.message ?? update.channel_post) as Record<string, unknown> | undefined;
  if (!msg || typeof msg.text !== 'string') return;
  if (msg.chat && (msg.chat as { id: number }).id !== BOT_CHAT) return;

  const text = (msg.text as string).trim();
  if (!text.startsWith('/')) return;

  const fromId = (msg.from as { id?: number } | undefined)?.id;
  const threadId = (msg.message_thread_id as number | undefined) ?? BOT_TOPIC;

  await handleCommand(env, text, msg.message_id as number | undefined, fromId, threadId);
}

export default {
  // Cron tiap 20 menit: 1 shard channel untuk hari ini + besok + 1 tanggal rotasi.
  async scheduled(_event: unknown, env: CronEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(
      (async () => {
        const nowMs = Date.now();
        const today = todayWIB();
        const shard = shardFor(nowMs);
        await syncShardDate(env, today, shard);
        await syncShardDate(env, addDays(today, 1), shard);
        const slot = Math.floor(nowMs / (2 * 3600 * 1000)) % ROTATE_OFFSETS.length;
        await syncShardDate(env, addDays(today, ROTATE_OFFSETS[slot]), shard);
        await pruneD1(env.DB, addDays(today, -4), addDays(today, 11));
      })(),
    );
  },
  // Trigger manual (sekali pakai / debug): /sync?key=RAHASIA&date=2026-09-05
  async fetch(req: Request, env: CronEnv): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/webhook' && req.method === 'POST') {
      if (env.BOT_WEBHOOK_SECRET && req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.BOT_WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 });
      }
      try {
        const update = (await req.json()) as Record<string, unknown>;
        await handleTelegramUpdate(env, update);
        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }
    if (url.pathname === '/sync' && env.CRON_KEY && url.searchParams.get('key') === env.CRON_KEY) {
      const date = url.searchParams.get('date') ?? todayWIB();
      const shardNo = url.searchParams.get('shard');
      const channels = shardNo === null ? FETCHABLE : FETCHABLE.slice(Number(shardNo) * SHARD_SIZE, (Number(shardNo) + 1) * SHARD_SIZE);
      try {
        const r = await syncShardDate(env, date, channels);
        return Response.json({ ok: true, ...r });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }
    return new Response('haru-epg-cron: /sync?key=...', { status: 404 });
  },
};