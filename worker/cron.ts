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
  CLOUDFLARE_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  BOT_USERNAME?: string;
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
// Hanya pemilik ID ini yang boleh memakai command bot (bisa dioverride via env ALLOWED_USER_IDS).
const OWNER_ID = 1515918048;
// Perintah resmi milik bot EPG — di luar topik EPG, selain ini selalu silent.
const EPG_COMMANDS = ['/start', '/help', '/list', '/add', '/remove', '/setmenu', '/status'];

function botUsername(env: CronEnv): string {
  return (env.BOT_USERNAME?.trim().toLowerCase() || 'haruepgbot').replace(/^@/, '');
}

// Parse "/cmd" atau "/cmd@target" di awal pesan.
function parseSlashCommand(text: string): { cmd: string; target: string | null } | null {
  const m = text.match(/^\/([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?/);
  if (!m) return null;
  return { cmd: `/${m[1].toLowerCase()}`, target: m[2] ? m[2].toLowerCase() : null };
}
// Limit gratis D1 per hari (level akun)
const D1_READ_LIMIT = 5000000;
const D1_WRITE_LIMIT = 100000;

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

const DB_NAMES: Record<string, string> = {
  '9862584d-76d5-465f-a774-0d8f37ebb897': 'haru-epg',
  '394035de-7e3c-42cc-b312-9b508a86c8c8': 'haru-stream-db',
  '59fa02c9-3066-4cd4-bb16-094520f771ce': 'harudrive-db',
};

function fmtNum(n: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(n));
}

function usageDot(pct: number): string {
  if (pct >= 90) return '🔴';
  if (pct >= 70) return '🟡';
  return '🟢';
}

async function fetchD1Usage(
  env: CronEnv,
): Promise<{ date: string; totalRead: number; totalWrite: number; dbs: { name: string; read: number; write: number }[] } | null> {
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) return null;
  const accountTag = env.CF_ACCOUNT_ID?.trim() || '11b88ee6fb0a7509cabc91b5b5cd64de';
  const day = new Date().toISOString().slice(0, 10); // hari UTC (reset limit tengah malam UTC)
  const query =
    'query($a:String!,$s:Date,$e:Date){viewer{accounts(filter:{accountTag:$a})' +
    '{d1AnalyticsAdaptiveGroups(limit:100,filter:{date_geq:$s,date_leq:$e},orderBy:[date_DESC])' +
    '{sum{rowsRead rowsWritten}dimensions{date databaseId}}}}}';
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { a: accountTag, s: day, e: day } }),
    });
    const j = (await res.json()) as {
      data?: { viewer?: { accounts?: { d1AnalyticsAdaptiveGroups?: { sum?: { rowsRead?: number; rowsWritten?: number }; dimensions?: { date?: string; databaseId?: string } }[] }[] } };
    };
    const groups = j?.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups ?? [];
    const dbs = groups.map((g) => ({
      name: DB_NAMES[g.dimensions?.databaseId ?? ''] ?? (g.dimensions?.databaseId ?? '?').slice(0, 8),
      read: Number(g.sum?.rowsRead ?? 0),
      write: Number(g.sum?.rowsWritten ?? 0),
    }));
    dbs.sort((a, b) => b.read - a.read);
    return {
      date: day,
      totalRead: dbs.reduce((a, b) => a + b.read, 0),
      totalWrite: dbs.reduce((a, b) => a + b.write, 0),
      dbs,
    };
  } catch {
    return null;
  }
}

function channelListLines(slugs: string[]): string {
  const bySlug = new Map(CHANNELS.map((c) => [c.slug, c.name]));
  return slugs.map((s, i) => `${i + 1}. ${bySlug.get(s) ?? s} — \`${s}\``).join('\n');
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

function allowedIds(env: CronEnv): Set<number> {
  if (env.ALLOWED_USER_IDS) {
    return new Set(env.ALLOWED_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean).map(Number));
  }
  return new Set([OWNER_ID]);
}

async function checkIsOwner(env: CronEnv, userId: number): Promise<boolean> {
  void env;
  return allowedIds(env).has(userId);
}

async function registerBotCommands(env: CronEnv): Promise<boolean> {
  const commands = [
    { command: 'start', description: 'Mulai dan panduan bot EPG' },
    { command: 'list', description: 'Lihat daftar channel EPG' },
    { command: 'add', description: 'Tambah channel (contoh: /add rcti,gtv)' },
    { command: 'remove', description: 'Hapus channel (contoh: /remove rcti)' },
    { command: 'status', description: 'Cek usage D1 hari ini' },
    { command: 'help', description: 'Panduan bot EPG' },
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
  threadId?: number,
  chatId: number = BOT_CHAT,
): Promise<boolean> {
  const parsed = parseSlashCommand(text);
  if (!parsed) return false;
  const { cmd, target } = parsed;
  // Perintah yang jelas ditujukan ke bot lain → diam total, di mana pun.
  if (target && target !== botUsername(env)) return false;
  const rest = text.split(/\s+/).slice(1).join(' ').trim();
  const known = new Set(CHANNELS.map((c) => c.slug));

  const reply = async (line: string) => {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: line,
      parse_mode: 'Markdown',
    };
    if (chatId === BOT_CHAT && threadId !== undefined) body.message_thread_id = threadId;
    if (replyTo) body.reply_to_message_id = replyTo;
    await tgFetch(env, 'sendMessage', body);
  };

  // Jika dipanggil via Private Chat dengan bot
  if (chatId !== BOT_CHAT) {
    if (cmd === '/start' || cmd === '/help') {
      await reply('👋 Halo! Saya bot *Haru EPG*.\nSaya aktif di grup Haru Releases pada topik *Jadwal TV*. Silakan gunakan bot di topik tersebut ya!');
      return true;
    }
    return false;
  }

  // DI LUAR TOPIK EPG: selalu silent total — tanpa teguran apa pun,
  // agar tidak nyampah di topik lain (termasuk General yang tidak punya thread id).
  if (threadId !== BOT_TOPIC) {
    return false;
  }

  // Semua command di topik EPG hanya untuk owner
  if (EPG_COMMANDS.includes(cmd)) {
    if (fromId === undefined || !(await checkIsOwner(env, fromId))) {
      await reply('⛔ Perintah bot hanya untuk owner.');
      return true;
    }
  }

  if (cmd === '/start' || cmd === '/help') {
    await reply(
      '🤖 *Bot Haru EPG*\n\n' +
        'Bot ini digunakan untuk mengelola channel jadwal TV EPG di topik ini.\n\n' +
        '• `/list` - Menampilkan channel aktif\n' +
        '• `/add <slug>` - Menambah channel (contoh: `/add rcti,gtv`)\n' +
        '• `/remove <slug>` - Menghapus channel (contoh: `/remove rcti`)\n' +
        '• `/status` - Cek usage D1 hari ini (reset tengah malam UTC)\n' +
        '• `/setmenu` - Pasang/perbarui tombol menu bot di grup\n\n' +
        '💡 _Jadwal harian diposting otomatis setiap jam 00:30 WIB._',
    );
    return true;
  }

  if (cmd === '/list') {
    const cur = await readTelegramChannels(env);
    await reply(`📋 *Channel bot (${cur.length})*\n${channelListLines(cur)}\n\n➕ \`/add rcti,gtv\`\n➖ \`/remove rcti\``);
    return true;
  }

  if (cmd === '/add' || cmd === '/remove') {
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
      `${cmd === '/add' ? '✅ *Ditambah*' : '🗑️ *Dihapus*'}: ${channelNames(good) || '(tidak ada)'}`,
      bad.length ? `❓ *Tidak dikenal*: ${bad.join(', ')}` : null,
      `📋 *Total kini: ${next.length} channel.* Lihat: /list`,
    ];
    await reply(notes.filter(Boolean).join('\n\n'));
    return true;
  }

  if (cmd === '/setmenu') {
    const ok = await registerBotCommands(env);
    await reply(ok ? '✅ Menu tombol bot berhasil diperbarui di grup!' : '❌ Gagal mendaftarkan menu bot ke Telegram.');
    return true;
  }

  if (cmd === '/status') {
    const u = await fetchD1Usage(env);
    if (!u) {
      await reply(
        env.CLOUDFLARE_API_TOKEN
          ? '❌ Gagal mengambil data usage D1.'
          : '❌ Token Cloudflare belum dipasang. Tambahkan secret `CLOUDFLARE_API_TOKEN` di worker dulu.',
      );
      return true;
    }
    const rp = (u.totalRead / D1_READ_LIMIT) * 100;
    const wp = (u.totalWrite / D1_WRITE_LIMIT) * 100;
    const lines = [
      `📊 *D1 Usage ${u.date} (UTC)*`,
      `${usageDot(rp)} Read: ${fmtNum(u.totalRead)} / ${fmtNum(D1_READ_LIMIT)} (${rp.toFixed(1)}%)`,
      `${usageDot(wp)} Write: ${fmtNum(u.totalWrite)} / ${fmtNum(D1_WRITE_LIMIT)} (${wp.toFixed(1)}%)`,
      '',
      ...u.dbs.map((d) => `• ${d.name}: ${fmtNum(d.read)} read / ${fmtNum(d.write)} write`),
    ];
    await reply(lines.join('\n'));
    return true;
  }

  return false;
}

async function handleTelegramUpdate(env: CronEnv, update: Record<string, unknown>): Promise<void> {
  const msg = (update.message ?? update.channel_post) as Record<string, unknown> | undefined;
  if (!msg || typeof msg.text !== 'string') return;

  const text = (msg.text as string).trim();
  if (!text.startsWith('/')) return;

  const chatId = (msg.chat as { id?: number } | undefined)?.id ?? BOT_CHAT;
  const fromId = (msg.from as { id?: number } | undefined)?.id;
  // General (tanpa message_thread_id) BUKAN topik kita → jangan default ke BOT_TOPIC.
  const threadId = msg.message_thread_id as number | undefined;

  await handleCommand(env, text, msg.message_id as number | undefined, fromId, threadId, chatId);
}

// --- Auto-post jadwal harian ke Telegram (pengganti GitHub Actions) ---
// Cron 30 17 (00:30 WIB) memulai run baru; tick */20 berikutnya melanjutkan
// batch per batch sampai selesai. Progres disimpan di D1 agar tahan interupsi.
const POST_CRON = '30 17 * * *';
const POST_BATCH = 8;
const POST_API_BASE = 'https://haru-epg.pages.dev';
const POST_TG_MAX = 4096;
const POST_CAPTION_MAX = 1000;

function postSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function postWithRetry(
  fn: () => Promise<{ ok: boolean; error_code?: number; parameters?: { retry_after?: number } }>,
  label: string,
): Promise<{ ok: boolean }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const json = await fn();
    if (json?.ok) return json;
    const wait = Number((json as { parameters?: { retry_after?: number } })?.parameters?.retry_after);
    if ((json as { error_code?: number })?.error_code === 429 && attempt < 3) {
      await postSleep((Number.isFinite(wait) ? wait : 5) * 1000 + 500);
      continue;
    }
    return json;
  }
  return { ok: false };
}

function postPrettyDate(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00+07:00`);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

function postFormatTime(iso: string): string {
  return iso?.slice(11, 16) ?? '??:??';
}

function postHtmlLine(p: { start: string; end: string; title: string }): string {
  return `• <b>${postFormatTime(p.start)} – ${postFormatTime(p.end)}</b> ${p.title}`;
}

function postHeader(date: string, channelName: string): string {
  return `<b>📺 ${channelName}</b>\n<i>${postPrettyDate(date)}</i>`;
}

function postFooter(slug: string): string {
  return `\n\n🌐 <b>Jadwal Selengkapnya:</b> <a href="${POST_API_BASE}/channel/${slug}">Klik disini</a>`;
}

function postSplitSchedule(
  date: string,
  slug: string,
  channelName: string,
  lines: string[],
): { caption: string; rest: string[] } {
  const header = postHeader(date, channelName);
  const footer = postFooter(slug);
  const full = header + '\n\n' + lines.join('\n') + footer;
  if (full.length <= POST_CAPTION_MAX) return { caption: full, rest: [] };
  let current = header + '\n\n';
  let i = 0;
  for (; i < lines.length; i++) {
    const test = current + lines[i] + '\n';
    if (test.length > POST_CAPTION_MAX - 40) break;
    current = test;
  }
  const ended = i >= lines.length;
  const caption = (current + (ended ? footer : '\n➡️ <i>lanjut di pesan berikut...</i>')).slice(0, POST_CAPTION_MAX);
  return { caption, rest: lines.slice(i) };
}

function postTextChunks(
  date: string,
  slug: string,
  channelName: string,
  lines: string[],
  isContinuation: boolean,
): string[] {
  if (lines.length === 0) return [];
  const footer = postFooter(slug);
  if (isContinuation) {
    const lead = '<i>Lanjutan jadwal:</i>\n\n';
    const single = lead + lines.join('\n') + footer;
    if (single.length <= POST_TG_MAX) return [single];
    const chunks: string[] = [];
    let cur = lead;
    let part = 2;
    for (const line of lines) {
      if ((cur + line + '\n' + footer).length > POST_TG_MAX - 30) {
        cur += `\n➡️ <i>lanjut part ${part}...</i>`;
        chunks.push(cur.trim());
        part++;
        cur = '';
      }
      cur += line + '\n';
    }
    cur += '\n' + footer;
    chunks.push(cur.trim());
    return chunks;
  }
  const header = postHeader(date, channelName);
  const fullText = header + '\n\n' + lines.join('\n') + footer;
  if (fullText.length <= POST_TG_MAX) return [fullText];
  const chunks: string[] = [];
  let cur = header + '\n\n';
  let part = 1;
  for (const line of lines) {
    if ((cur + line + '\n' + footer).length > POST_TG_MAX - 30) {
      cur += `\n➡️ <i>lanjut part ${part + 1}...</i>`;
      chunks.push(cur.trim());
      part++;
      cur = `<b>📺 ${channelName}</b> (part ${part})\n<i>${postPrettyDate(date)}</i>\n\n`;
    }
    cur += line + '\n';
  }
  cur += '\n' + footer;
  chunks.push(cur.trim());
  return chunks;
}

async function readPostState(env: CronEnv, date: string): Promise<{ next: number; total: number; done: boolean; posted: number; failed: number; pin: number } | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare('SELECT next_index, total, done, posted, failed, pin_msg_id FROM bot_post WHERE date = ?1')
    .bind(date)
    .first<{ next_index: number; total: number; done: number; posted: number; failed: number; pin_msg_id: number }>();
  if (!row) return null;
  return { next: row.next_index, total: row.total, done: row.done === 1, posted: row.posted ?? 0, failed: row.failed ?? 0, pin: row.pin_msg_id ?? 0 };
}

async function writePostState(
  env: CronEnv,
  date: string,
  next: number,
  total: number,
  done: boolean,
  posted = 0,
  failed = 0,
  pin?: number,
): Promise<void> {
  let nextPin = pin;
  if (nextPin === undefined) {
    const row = await readPostState(env, date);
    nextPin = row?.pin ?? 0;
  }
  await env.DB.prepare(
    'INSERT INTO bot_post (date, next_index, total, done, posted, failed, pin_msg_id, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ' +
      'ON CONFLICT(date) DO UPDATE SET next_index = ?2, total = ?3, done = ?4, posted = ?5, failed = ?6, pin_msg_id = ?7, updated_at = ?8',
  )
    .bind(date, next, total, done ? 1 : 0, posted, failed, nextPin, new Date().toISOString())
    .run();
}

async function postOneChannel(
  env: CronEnv,
  date: string,
  slug: string,
): Promise<{ ok: boolean; textFailed: number }> {
  const meta = CHANNELS.find((c) => c.slug === slug);
  const name = meta?.name ?? slug;
  const logoUrl = meta?.logo ? POST_API_BASE + meta.logo : null;

  const row = await env.DB.prepare(
    'SELECT programs_json FROM channel_days WHERE channel_slug = ?1 AND date = ?2',
  )
    .bind(slug, date)
    .first<{ programs_json: string }>();
  let programs: { start: string; end: string; title: string }[] = [];
  try {
    const arr = JSON.parse(row?.programs_json ?? '[]') as { start: string; end: string; title: string }[];
    if (Array.isArray(arr)) programs = arr;
  } catch {}
  if (programs.length === 0) return { ok: false, textFailed: 0 };

  const lines = programs.map(postHtmlLine);
  const base = { chat_id: BOT_CHAT, message_thread_id: BOT_TOPIC };
  let textFailed = 0;

  const sendText = async (text: string): Promise<boolean> => {
    const r = await postWithRetry(
      () => tgFetch(env, 'sendMessage', { ...base, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      'sendMessage',
    );
    if (!r.ok) textFailed++;
    return r.ok;
  };

  if (logoUrl) {
    const { caption, rest } = postSplitSchedule(date, slug, name, lines);
    const photo = await postWithRetry(
      () => tgFetch(env, 'sendPhoto', { ...base, photo: logoUrl, caption, parse_mode: 'HTML' }),
      'sendPhoto',
    );
    if (photo.ok) {
      await postSleep(2000);
      const cont = postTextChunks(date, slug, name, rest, true);
      for (let i = 0; i < cont.length; i++) {
        await sendText(cont[i]);
        if (i < cont.length - 1) await postSleep(1000);
      }
      return { ok: textFailed === 0, textFailed };
    }
  }

  const msgs = postTextChunks(date, slug, name, lines, false);
  for (let i = 0; i < msgs.length; i++) {
    await sendText(msgs[i]);
    if (i < msgs.length - 1) await postSleep(1000);
  }
  return { ok: textFailed === 0, textFailed };
}

async function sendOpeningPost(env: CronEnv, date: string, channels: string[]): Promise<void> {
  const bySlug = new Map(CHANNELS.map((c) => [c.slug, c.name]));
  const list = channels.map((s, i) => `${i + 1}. ${bySlug.get(s) ?? s}`).join('\n');
  const text = `📺 *Jadwal TV Hari Ini (${postPrettyDate(date)})*\n\nChannel yang akan dikirim:\n${list}`;
  // Lepas pin kemarin (best-effort) agar hanya pesan ini yang ter-pin
  try {
    const y = await readPostState(env, addDays(date, -1));
    if (y?.pin) await tgFetch(env, 'unpinChatMessage', { chat_id: BOT_CHAT, message_id: y.pin });
  } catch {}
  const sent = await postWithRetry(
    () =>
      tgFetch(env, 'sendMessage', {
        chat_id: BOT_CHAT,
        message_thread_id: BOT_TOPIC,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    'sendMessage',
  );
  const msgId = (sent.result as { message_id?: number } | undefined)?.message_id;
  if (msgId) {
    try {
      await tgFetch(env, 'pinChatMessage', { chat_id: BOT_CHAT, message_id: msgId, disable_notification: true });
    } catch {}
    const st = await readPostState(env, date);
    await writePostState(env, date, st?.next ?? 0, channels.length, false, st?.posted ?? 0, st?.failed ?? 0, msgId);
  }
}

async function postNextBatch(
  env: CronEnv,
  date: string,
): Promise<{ posted: number; failed: number; done: boolean; total: number }> {
  const channels = await readTelegramChannels(env);
  const st = await readPostState(env, date);
  const start = st ? st.next : 0;
  let posted = st ? st.posted : 0;
  let failed = st ? st.failed : 0;
  if (start === 0) {
    await sendOpeningPost(env, date, channels);
  }
  const slice = channels.slice(start, start + POST_BATCH);
  for (const slug of slice) {
    try {
      const r = await postOneChannel(env, date, slug);
      if (r.ok) posted++;
      else failed++;
    } catch {
      failed++;
    }
    await writePostState(env, date, posted + failed, channels.length, false, posted, failed);
    await postSleep(2500);
  }
  const next = posted + failed;
  const done = next >= channels.length;
  await writePostState(env, date, next, channels.length, done, posted, failed);
  if (done) {
    const extra = failed > 0 ? `, ${failed} gagal` : '';
    await tgFetch(env, 'sendMessage', {
      chat_id: BOT_CHAT,
      message_thread_id: BOT_TOPIC,
      text:
        `✅ Jadwal ${postPrettyDate(date)} berhasil terkirim (${posted}/${channels.length} channel${extra})\n\n` +
        `🌐 Jadwal Selengkapnya: ${POST_API_BASE}`,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }
  return { posted, failed, done, total: channels.length };
}

export default {
  // Cron tiap 20 menit: 1 shard channel untuk hari ini + besok + 1 tanggal rotasi.
  // Cron 30 17 (00:30 WIB): mulai run auto-post; tick */20 berikut melanjutkan batch.
  async scheduled(event: { cron: string }, env: CronEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(
      (async () => {
        const today = todayWIB();
        if (event?.cron === POST_CRON) {
          // Run posting baru — tanpa sync di tick ini agar hemat subrequest
          await writePostState(env, today, 0, 0, false);
          await postNextBatch(env, today);
          return;
        }
        // Lanjutkan run posting hari ini bila belum selesai (skip sync tick ini)
        const st = await readPostState(env, today);
        if (st && !st.done && st.next < st.total) {
          await postNextBatch(env, today);
          return;
        }
        const nowMs = Date.now();
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
    // Trigger manual posting (tes): /post?key=...&date=...&start=0&count=2
    // Tidak menyentuh progres bot_post (terisolasi dari run otomatis).
    if (url.pathname === '/post' && env.CRON_KEY && url.searchParams.get('key') === env.CRON_KEY) {
      const date = url.searchParams.get('date') ?? todayWIB();
      const start = Math.max(0, Number(url.searchParams.get('start') ?? '0') || 0);
      const count = Math.max(1, Math.min(POST_BATCH, Number(url.searchParams.get('count') ?? String(POST_BATCH)) || POST_BATCH));
      try {
        const channels = await readTelegramChannels(env);
        const slice = channels.slice(start, start + count);
        let posted = 0;
        let failed = 0;
        for (const slug of slice) {
          try {
            const r = await postOneChannel(env, date, slug);
            if (r.ok) posted++;
            else failed++;
          } catch {
            failed++;
          }
          await postSleep(2500);
        }
        return Response.json({ ok: true, date, posted, failed, total: channels.length });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }
    return new Response('haru-epg-cron: /sync?key=...', { status: 404 });
  },
};