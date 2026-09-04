import { fetchAllPrograms } from '../src/lib/sync';
import { writeDayToD1, type D1Db } from '../src/lib/store';

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

async function syncDate(env: CronEnv, date: string): Promise<{ date: string; count: number }> {
  const programs = await fetchAllPrograms(env, date);
  await writeDayToD1(env.DB, date, programs);
  return { date, count: programs.length };
}

export default {
  // Cron tiap 2 jam: refresh hari ini + besok (agar date picker instan).
  async scheduled(_event: unknown, env: CronEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(
      (async () => {
        const today = todayWIB();
        await syncDate(env, today);
        await syncDate(env, addDays(today, 1));
      })(),
    );
  },
  // Trigger manual (sekali pakai / debug): /sync?key=RAHASIA&date=2026-09-05
  async fetch(req: Request, env: CronEnv): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/sync' && env.CRON_KEY && url.searchParams.get('key') === env.CRON_KEY) {
      const date = url.searchParams.get('date') ?? todayWIB();
      try {
        const r = await syncDate(env, date);
        return Response.json({ ok: true, ...r });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }
    return new Response('haru-epg-cron: use /sync?key=...', { status: 404 });
  },
};
