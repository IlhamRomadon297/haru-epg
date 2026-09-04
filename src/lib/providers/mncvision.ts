import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import { decodeEntities, programSlug } from './tivie';
import type { Provider } from './types';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0 (+https://haru-epg.pages.dev)';

/**
 * Scraper MNC Vision — https://www.mncvision.id/schedule/table
 * - Daftar 133 channel + ID numerik ada di <select name="fchannel"> halaman itu.
 * - Jadwal per channel+ tanggal: POST form (search_model=channel, fchannel={id}, fdate=YYYY-MM-DD).
 * - Hasil: tabel Jam Tayang | Program Acara | Durasi, link detail mengandung
 *   timestamp /schedule/detail/{YYYYMMDDHHMM}{channelId}/{Judul}/1.
 */
export async function fetchMncChannel(mncId: string, channel: Channel, dateISO: string): Promise<EpgProgram[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const body = new URLSearchParams({
      search_model: 'channel',
      af0rmelement: 'aformelement',
      fchannel: mncId,
      fdate: dateISO,
      submit: 'Cari',
    });
    const res = await fetch('https://www.mncvision.id/schedule/table', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
      },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`mnc ${res.status}`);
    const html = await res.text();

    // <td>HH:MM</td> <td><a href=".../schedule/detail/{12 digit}{id}/{slug}/..">Judul</a></td> <td>Durasi</td>
    const re =
      /<td class="text-center">(\d{2}:\d{2})<\/td>\s*<td><a href="[^"]*\/schedule\/detail\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\d*\/[^"]*"[^>]*>([^<]+)<\/a><\/td>/g;
    const starts: { start: string; title: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const [, , Y, Mo, D, H, Mi, rawTitle] = m;
      const title = decodeEntities(rawTitle).trim();
      if (!title) continue;
      starts.push({ start: `${Y}-${Mo}-${D}T${H}:${Mi}:00+07:00`, title });
    }
    starts.sort((a, b) => a.start.localeCompare(b.start));

    return starts.map((s, i) => {
      const end =
        i + 1 < starts.length ? starts[i + 1].start : `${dateISO}T23:59:00+07:00`;
      const hhmm = s.start.slice(11, 16);
      return {
        id: `mnc-${channel.slug}-${s.start}`,
        channelSlug: channel.slug,
        channelName: channel.name,
        date: dateISO,
        start: s.start,
        end,
        startLabel: `${hhmm} WIB`,
        endLabel: `${end.slice(11, 16)} WIB`,
        title: s.title,
        slug: programSlug(channel.slug, s.start, s.title),
      } satisfies EpgProgram;
    });
  } finally {
    clearTimeout(t);
  }
}

export const mncvisionProvider: Provider = {
  id: 'mncvision',
  name: 'MNC Vision',
  supportsDates: true,
  async fetchChannel(channel: Channel, dateISO: string): Promise<EpgProgram[]> {
    const ref = channel.providerRef ?? '';
    if (!/^\d+$/.test(ref)) return [];
    try {
      return await fetchMncChannel(ref, channel, dateISO);
    } catch {
      return [];
    }
  },
};
