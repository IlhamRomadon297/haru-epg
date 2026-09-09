import { CHANNELS, type Channel } from '../src/lib/channels';
import { providerRefOf } from '../src/lib/providers/index';
import { fetchProgramsForChannels } from '../src/lib/sync';
import { pruneD1, writeDayToD1, type D1Db } from '../src/lib/store';

interface CronEnv {
  DB: D1Db;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_API_KEY?: string;
  CRON_KEY?: string;
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
    return new Response('haru-epg-cron: use /sync?key=...', { status: 404 });
  },
};