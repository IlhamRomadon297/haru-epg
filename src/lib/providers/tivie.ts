import { getChannel, type Channel } from '../channels';
import type { EpgProgram } from '../types';
import type { Provider } from './types';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0 (+https://haru-epg.pages.dev)';

function decodeEntities(s: string): string {
  return s
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function programSlug(channelSlug: string, startISO: string, title: string): string {
  const d = startISO.slice(0, 10);
  return `${channelSlug}-${d}-${slugify(title)}`.slice(0, 120);
}

function toWIBLabel(iso: string): string {
  // iso sudah +07:00 → ambil HH:MM langsung
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]} WIB` : iso;
}

async function fetchHtml(url: string, timeoutMs = 12000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`tivie ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

interface JsonLdBroadcast {
  '@type'?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

/** Ambil jadwal 1 channel dari tivie.id via JSON-LD BroadcastEvent. */
export async function fetchTivieChannel(
  tivieSlug: string,
  datePath?: string, // YYYYMMDD untuk arsip, kosong = hari ini
): Promise<EpgProgram[]> {
  const channel = getChannel(tivieSlug);
  const slug = channel?.slug ?? tivieSlug;
  const name = channel?.name ?? tivieSlug.toUpperCase();
  const url = datePath
    ? `https://tivie.id/channel/${tivieSlug}/${datePath}`
    : `https://tivie.id/channel/${tivieSlug}`;

  const html = await fetchHtml(url);

  // 1) Kumpulkan semua JSON-LD BroadcastEvent
  const events: JsonLdBroadcast[] = [];
  const re = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item?.['@type'] === 'BroadcastEvent' && item.startDate) events.push(item);
      }
    } catch {
      /* abaikan blok rusak */
    }
  }

  // 2) Kumpulkan link /program/xxx & /film/xxx sesuai urutan tampil
  const linkRe = /\/(program|film)\/([a-z0-9-]+)/gi;
  const links: { kind: 'program' | 'film'; slug: string }[] = [];
  const seen = new Set<string>();
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) !== null) {
    const kind = lm[1].toLowerCase() as 'program' | 'film';
    const pslug = lm[2];
    const key = `${kind}:${pslug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ kind, slug: pslug });
  }

  const programs: EpgProgram[] = events.map((ev, i) => {
    const title = decodeEntities(String(ev.name ?? 'Tanpa Judul')).trim();
    const start = String(ev.startDate);
    const end = String(ev.endDate ?? start);
    const date = start.slice(0, 10);
    const link = links[i];
    return {
      id: `${slug}-${start}`,
      channelSlug: slug,
      channelName: name,
      date,
      start,
      end,
      startLabel: toWIBLabel(start),
      endLabel: toWIBLabel(end),
      title,
      description: ev.description ? decodeEntities(String(ev.description)) : undefined,
      sourceSlug: link?.slug,
      sourceKind: link?.kind,
      slug: programSlug(slug, start, title),
    };
  });

  programs.sort((a, b) => a.start.localeCompare(b.start));
  return programs;
}

export interface TivieProgramDetail {
  title: string;
  category?: string;
  poster?: string;
  description?: string;
  airings: { channelSlug: string; channelName: string; start: string; label: string }[];
}

/** Ambil detail program/film dari tivie.id. */
export async function fetchTivieProgram(kind: 'program' | 'film', slug: string): Promise<TivieProgramDetail | null> {
  const url = `https://tivie.id/${kind}/${slug}`;
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    return null;
  }

  const pick = (re: RegExp): string | undefined => {
    const mm = html.match(re);
    return mm ? decodeEntities(mm[1]).trim() : undefined;
  };

  const title =
    pick(/<h2[^>]*class="[^"]*font-bold[^"]*"[^>]*>(.*?)<\/h2>/s)?.replace(/<[^>]+>/g, '') ||
    pick(/<meta property="og:title" content="([^"]+)"/) ||
    slug;
  const poster = pick(/<meta property="og:image" content="([^"]+)"/);
  const description = pick(/<meta name="description" content="([^"]+)"/);
  const category = pick(/\/programs\/([a-z0-9-]+)/);

  // Jadwal tayang: cari blok channel + timestamp start
  const airings: TivieProgramDetail['airings'] = [];
  const airRe = /channel\/([a-z0-9]+)[^]*?start:\s*(\d{13})/g;
  let am: RegExpExecArray | null;
  while ((am = airRe.exec(html)) !== null) {
    const [, chSlug, ms] = am;
    const ch = getChannel(chSlug);
    const dt = new Date(Number(ms));
    // konversi ke WIB ISO kasar
    const wib = new Date(dt.getTime() + (7 * 60 + dt.getTimezoneOffset()) * 60000);
    const iso = wib.toISOString().replace('Z', '+07:00');
    airings.push({
      channelSlug: ch?.slug ?? chSlug,
      channelName: ch?.name ?? chSlug,
      start: iso,
      label: toWIBLabel(iso),
    });
    if (airings.length >= 14) break;
  }

  return { title: decodeEntities(title), category, poster, description, airings };
}

export const tivieProvider: Provider = {
  id: 'tivie',
  name: 'tivie.id',
  supportsDates: true,
  async fetchChannel(channel: Channel, dateISO: string): Promise<EpgProgram[]> {
    const ref = channel.providerRef ?? channel.tivieSlug ?? channel.slug;
    try {
      return await fetchTivieChannel(ref, dateISO.replaceAll('-', ''));
    } catch {
      return [];
    }
  },
};
