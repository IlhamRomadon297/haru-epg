import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import { programSlug } from './tivie';
import type { Provider } from './types';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0 (+https://haru-epg.pages.dev)';

/**
 * Scraper Singtel TV — endpoint JSON harian (resep: iptv-org/epg sites/singtel.com):
 *   https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/{DDMMYYYY}.json
 * - File tersedia untuk H-3 s/d H+10 (di luar itu 404 → []).
 * - Isi: { "{epgChannelId}": [{ startDateTime, duration(detik), program:{title, subCategory, description} }] }
 * - startDateTime zona Asia/Singapura (+08:00) → dikonversi ke WIB (+07:00).
 * - Peta title→epgChannelId ada di datamodel <ux-tv-channel-epg> halaman tv-programme-guide.
 */
interface SingtelItem {
  startDateTime?: string;
  duration?: string | number;
  program?: {
    title?: string;
    subCategory?: string;
    description?: string;
    programValues?: { name?: string; description?: string }[];
  };
}

/** Nomor episode dari programValues (MSEPG_Syndicated_Episode_Number). */
function episodeOf(it: SingtelItem): string | null {
  const vals = it.program?.programValues ?? [];
  for (const v of vals) {
    if (v?.name === 'MSEPG_Syndicated_Episode_Number' && v.description?.trim()) {
      return v.description.trim();
    }
  }
  return null;
}

/** "2026-09-03T23:54:00" (+08:00) → ISO WIB "+07:00". */
function sgtToWibIso(local: string, plusSeconds = 0): string {
  const ms = Date.parse(`${local}+08:00`) + plusSeconds * 1000;
  const wib = new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 16);
  return `${wib}:00+07:00`;
}

async function fetchSingtelJson(dateStr: string): Promise<Record<string, SingtelItem[]> | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(
      `https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/${dateStr}.json`,
      { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal },
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, SingtelItem[]>;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function nextDayISO(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00+07:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function fetchSingtelChannel(
  epgId: string,
  channel: Channel,
  dateISO: string,
): Promise<EpgProgram[]> {
  const [Y, M, D] = dateISO.split('-');
  if (!Y || !M || !D) return [];

  // Fetch today + tomorrow SGT data supaya program 23:00-23:59 WIB (00:00-00:59 SGT besok) keambil
  const [Y2, M2, D2] = nextDayISO(dateISO).split('-');
  const [todayData, tomorrowData] = await Promise.all([
    fetchSingtelJson(`${D}${M}${Y}`),
    fetchSingtelJson(`${D2}${M2}${Y2}`),
  ]);

  const allItems: SingtelItem[] = [
    ...(todayData?.[epgId] ?? []),
    ...(tomorrowData?.[epgId] ?? []),
  ];

  const out: EpgProgram[] = [];
  for (const it of allItems) {
    if (!it?.startDateTime) continue;
    const start = sgtToWibIso(it.startDateTime);
    if (start.slice(0, 10) !== dateISO) continue;
    const dur = Number(it.duration ?? 0) || 0;
    const end = sgtToWibIso(it.startDateTime, dur);
    let title = (it.program?.title ?? 'Tanpa Judul').trim();
    const ep = episodeOf(it);
    if (ep && !/(\bep\.?\s*\d|\(\d+\)|episode\s*\d)/i.test(title)) {
      title = `${title} (Ep ${ep})`;
    }
    out.push({
      id: `sg-${channel.slug}-${start}`,
      channelSlug: channel.slug,
      channelName: channel.name,
      date: dateISO,
      start,
      end,
      startLabel: `${start.slice(11, 16)} WIB`,
      endLabel: `${end.slice(11, 16)} WIB`,
      title,
      category: it.program?.subCategory || undefined,
      description: it.program?.description || undefined,
      slug: programSlug(channel.slug, start, title),
    });
  }
  out.sort((a, b) => a.start.localeCompare(b.start));
  return out;
}

export const singtelProvider: Provider = {
  id: 'singtel',
  name: 'Singtel TV',
  supportsDates: true, // jendela file: H-3 s/d H+10
  async fetchChannel(channel: Channel, dateISO: string): Promise<EpgProgram[]> {
    const ref = channel.providerRef ?? '';
    if (!/^\d+$/.test(ref)) return [];
    return fetchSingtelChannel(ref, channel, dateISO);
  },
};
