import { CHANNELS, byFeatured, getChannel } from './channels';
import { getProvider, providerRefOf } from './providers/index';
import { fetchSheetOverrides, type SheetEnv } from './sheets';
import { readDayFromD1, writeDayToD1, type D1Db } from './store';
import { fetchAllPrograms, mergePrograms } from './sync';
import type { ChannelSchedule, DaySchedule, EpgProgram } from './types';

export const DEFAULT_TTL = 5400; // 1.5 jam
/** D1 dianggap segar bila ditulis < 12 jam lalu (cron jalan tiap jam). */
export const D1_MAX_AGE_MS = 6 * 3600 * 1000;

type Env = SheetEnv & { CACHE_TTL?: string; DB?: unknown };

/** Tanggal hari ini dalam WIB (YYYY-MM-DD). */
export function todayWIB(date = new Date()): string {
  const wib = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

export function toDatePath(dateISO: string): string {
  return dateISO.replaceAll('-', '');
}

export function prettyDate(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00+07:00`);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

export function isLive(nowMs: number, p: EpgProgram): boolean {
  const s = Date.parse(p.start);
  const e = Date.parse(p.end);
  return Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
}

export function progress(nowMs: number, p: EpgProgram): number {
  const s = Date.parse(p.start);
  const e = Date.parse(p.end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 0;
  return Math.min(100, Math.max(0, ((nowMs - s) / (e - s)) * 100));
}

// --- Cache: Cloudflare Cache API bila ada, fallback memori (dev) ---
const mem = new Map<string, { exp: number; data: DaySchedule }>();

function cacheKey(kind: string, date: string): string {
  return `https://haru-epg.internal/cache/v8/${kind}/${date}`;
}

function ttlSeconds(env: Env): number {
  const n = Number(env.CACHE_TTL);
  if (Number.isFinite(n) && n >= 300 && n <= 7200) return Math.floor(n);
  return DEFAULT_TTL;
}

async function readCache(key: string): Promise<DaySchedule | null> {
  try {
    const cache = (globalThis as unknown as { caches?: CacheStorage }).caches?.default;
    if (cache) {
      const hit = await cache.match(key);
      if (hit) {
        const data = (await hit.json()) as DaySchedule;
        return { ...data, source: 'cache' as const };
      }
      return null;
    }
  } catch {
    /* abaikan */
  }
  const m = mem.get(key);
  if (m && m.exp > Date.now()) return { ...m.data, source: 'cache' };
  return null;
}

async function writeCache(key: string, data: DaySchedule, ttl: number): Promise<void> {
  try {
    const cache = (globalThis as unknown as { caches?: CacheStorage }).caches?.default;
    if (cache) {
      await cache.put(
        key,
        new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${ttl}`,
          },
        }),
      );
      return;
    }
  } catch {
    /* abaikan */
  }
  mem.set(key, { exp: Date.now() + ttl * 1000, data });
}

/** Hitung ulang now/next dengan jam saat ini (wajib dipanggil untuk data dari cache). */
export function attachLive(channels: ChannelSchedule[], nowMs = Date.now()): void {
  for (const c of channels) {
    c.now = c.programs.find((p) => isLive(nowMs, p)) ?? null;
    c.next = c.programs.find((p) => Date.parse(p.start) > nowMs) ?? null;
  }
}
/** Bangun DaySchedule dari daftar program mentah (dipakai jalur D1 & live). */
function buildDay(date: string, all: EpgProgram[], source: DaySchedule['source']): DaySchedule {
  const nowMs = Date.now();
  const channels: ChannelSchedule[] = [...CHANNELS].sort(byFeatured).map((c) => {
    const programs = all
      .filter((p) => p.channelSlug === c.slug && p.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));
    const now = programs.find((p) => isLive(nowMs, p)) ?? null;
    const next = programs.find((p) => Date.parse(p.start) > nowMs) ?? null;
    return { slug: c.slug, name: c.name, category: c.category, logo: c.logo, programs, now, next };
  });

  // Sheet bisa membawa channel baru yang belum terdaftar → tampilkan juga
  const known = new Set(CHANNELS.map((c) => c.slug));
  for (const p of all) {
    if (p.date !== date || known.has(p.channelSlug)) continue;
    known.add(p.channelSlug);
    const programs = all
      .filter((x) => x.channelSlug === p.channelSlug && x.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));
    channels.push({
      slug: p.channelSlug,
      name: p.channelName,
      category: 'paytv',
      programs,
      now: programs.find((x) => isLive(nowMs, x)) ?? null,
      next: programs.find((x) => Date.parse(x.start) > nowMs) ?? null,
    });
  }

  const result: DaySchedule = {
    date,
    label: prettyDate(date),
    channels,
    totalPrograms: all.filter((p) => p.date === date).length,
    cachedAt: new Date().toISOString(),
    source,
  };
  return result;
}

export async function getDaySchedule(env: Env, dateISO?: string): Promise<DaySchedule> {
  const date = dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? dateISO : todayWIB();
  const ttl = ttlSeconds(env);
  const key = cacheKey('day', date);

  const cached = await readCache(key);
  if (cached) {
    // now/next yang tersimpan basi (dihitung saat cache ditulis) → hitung ulang
    attachLive(cached.channels);
    return cached;
  }

  // 1) D1 dulu (diisi cron tiap jam — instan, tanpa scrape per request).
  //    Aturan kesegaran: tanggal lampau selalu OK (jadwal arsip), hari ini/masa depan < 12 jam.
  if (env.DB) {
    try {
      const d1 = await readDayFromD1(env.DB as D1Db, date);
      const ageOk = Date.now() - Date.parse(d1?.updatedAt ?? '') < D1_MAX_AGE_MS;
      if (d1 && d1.programs.length > 0 && (date < todayWIB() || ageOk)) {
        const result = buildDay(date, d1.programs, 'd1');
        await writeCache(key, result, ttl);
        return result;
      }
    } catch {
      /* jatuh ke live */
    }
  }

  // 2) Fallback live: scrape provider + sheet langsung, lalu tulis ke D1 (write-through)
  const all = await fetchAllPrograms(env, date);
  if (env.DB && all.length > 0) {
    try {
      await writeDayToD1(env.DB as D1Db, date, all);
    } catch {
      /* cache tetap ditulis di bawah */
    }
  }
  const result = buildDay(date, all, 'live');

  await writeCache(key, result, ttl);
  return result;
}

export async function getChannelSchedule(
  env: Env,
  slug: string,
  dateISO?: string,
): Promise<{ channel: ChannelSchedule & { description?: string }; date: string; label: string } | null> {
  const ch = getChannel(slug);
  if (!ch) return null;
  const date = dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? dateISO : todayWIB();

  // Coba ambil dari cache harian dulu (hemat scrape)
  const day = await getDaySchedule(env, date);
  const found = day.channels.find((c) => c.slug === ch.slug);
  if (found && found.programs.length > 0) {
    return { channel: { ...found, name: ch.name, description: ch.description }, date, label: day.label };
  }

  // Fallback: scrape langsung 1 channel via providernya (mis. channel baru / cache kosong sebagian)
  let programs: EpgProgram[] = [];
  if (providerRefOf(ch) !== '') {
    try {
      programs = await getProvider(ch).fetchChannel(ch, date);
    } catch {
      programs = [];
    }
  }
  const sheet = await fetchSheetOverrides(env, date);
  programs = mergePrograms(programs, sheet, date).filter((p) => p.channelSlug === ch.slug);
  const nowMs = Date.now();
  return {
    channel: {
      slug: ch.slug,
      name: ch.name,
      category: ch.category,
      logo: ch.logo,
      programs,
      now: programs.find((p) => isLive(nowMs, p)) ?? null,
      next: programs.find((p) => Date.parse(p.start) > nowMs) ?? null,
      description: ch.description,
    },
    date,
    label: prettyDate(date),
  };
}

export function findProgram(day: DaySchedule, slug: string): EpgProgram | undefined {
  for (const c of day.channels) {
    const p = c.programs.find((x) => x.slug === slug);
    if (p) return p;
  }
  return undefined;
}
