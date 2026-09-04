import { getChannel } from './channels';
import { programSlug } from './tivie';
import type { EpgProgram } from './types';

export interface SheetEnv {
  GOOGLE_SHEET_ID?: string;
  GOOGLE_API_KEY?: string;
}

/**
 * Kolom spreadsheet yang didukung (header baris 1, case-insensitive):
 * Channel | Tanggal | Jam Mulai | Jam Selesai | Judul Acara | Kategori | Deskripsi
 * Tanggal: YYYY-MM-DD, Jam: HH:MM (WIB)
 */
interface SheetRow {
  channel: string;
  date: string;
  start: string;
  end: string;
  title: string;
  category?: string;
  description?: string;
}

function parseGviz(jsonText: string): unknown[][] {
  // gviz mengembalikan google.visualization.Query.setResponse({...});
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start < 0 || end < 0) return [];
  try {
    const obj = JSON.parse(jsonText.slice(start, end + 1));
    const cols: string[] = (obj.table?.cols ?? []).map((c: { label?: string }) => String(c?.label ?? '').toLowerCase());
    const rows: unknown[][] = [];
    for (const r of obj.table?.rows ?? []) {
      const cells = (r.c ?? []).map((c: { v?: unknown } | null) => c?.v ?? '');
      rows.push([cols, cells]);
    }
    // kembalikan [header, values] per baris — disederhanakan di bawah
    return rows as unknown as unknown[][];
  } catch {
    return [];
  }
}

function rowsToPrograms(raw: { header: string[]; values: unknown[] }[]): EpgProgram[] {
  const out: EpgProgram[] = [];
  for (const { header, values } of raw) {
    const get = (names: string[]): string => {
      for (const n of names) {
        const i = header.indexOf(n);
        if (i >= 0 && values[i] != null && String(values[i]).trim() !== '') return String(values[i]).trim();
      }
      return '';
    };
    const channelRaw = get(['channel']);
    const dateRaw = get(['tanggal', 'date']);
    const startRaw = get(['jam mulai', 'jam_mulai', 'mulai', 'start']);
    const endRaw = get(['jam selesai', 'jam_selesai', 'selesai', 'end']);
    const title = get(['judul acara', 'judul', 'title', 'acara']);
    if (!channelRaw || !title) continue;
    const ch = getChannel(channelRaw.toLowerCase().replace(/\s+/g, '-')) ??
      getChannel(channelRaw.toLowerCase());
    const channelSlug = ch?.slug ?? channelRaw.toLowerCase().replace(/\s+/g, '-');
    const channelName = ch?.name ?? channelRaw;
    const date = normalizeDate(dateRaw);
    if (!date) continue;
    const start = `${date}T${normalizeTime(startRaw)}:00+07:00`;
    const end = `${date}T${normalizeTime(endRaw || startRaw)}:00+07:00`;
    out.push({
      id: `sheet-${channelSlug}-${start}-${title}`.slice(0, 160),
      channelSlug,
      channelName,
      date,
      start,
      end,
      startLabel: `${normalizeTime(startRaw)} WIB`,
      endLabel: `${normalizeTime(endRaw || startRaw)} WIB`,
      title,
      category: get(['kategori', 'category']) || undefined,
      description: get(['deskripsi', 'description', 'desc']) || undefined,
      slug: programSlug(channelSlug, start, title),
      manual: true,
    });
  }
  return out;
}

function normalizeDate(s: string): string {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // format Date serial dari gviz: "Date(2026,8,4)"
  const dm = s.match(/Date\((\d+),(\d+),(\d+)/);
  if (dm) {
    const y = dm[1];
    const mo = String(Number(dm[2]) + 1).padStart(2, '0');
    const d = String(dm[3]).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function normalizeTime(s: string): string {
  s = s.trim();
  const m = s.match(/(\d{1,2})[:.](\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return '00:00';
}

/** Ambil override manual dari Google Spreadsheet. Gagal → [] (situs tetap jalan). */
export async function fetchSheetOverrides(env: SheetEnv): Promise<EpgProgram[]> {
  const id = env.GOOGLE_SHEET_ID?.trim();
  if (!id) return [];
  try {
    // 1) Coba Sheets API v4 bila ada API key
    if (env.GOOGLE_API_KEY?.trim()) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/A1:G1000?key=${encodeURIComponent(env.GOOGLE_API_KEY.trim())}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { values?: string[][] };
        const values = data.values ?? [];
        if (values.length > 1) {
          const header = values[0].map((h) => String(h).toLowerCase());
          return rowsToPrograms(values.slice(1).map((v) => ({ header, values: v })));
        }
      }
    }
    // 2) Fallback publikasi gviz (butuh sheet "Publish to web" / anyone with link)
    const gviz = await fetch(
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:json`,
      { headers: { 'User-Agent': 'HaruEPG/1.0' } },
    );
    if (!gviz.ok) return [];
    const text = await gviz.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0) return [];
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      table?: { cols?: { label?: string }[]; rows?: { c?: { v?: unknown; f?: string }[] | null }[] };
    };
    const header = (obj.table?.cols ?? []).map((c) => String(c.label ?? '').toLowerCase());
    const rows = (obj.table?.rows ?? []).map((r) => ({
      header,
      values: (r.c ?? []).map((c) => (c?.f ?? c?.v ?? '') as unknown),
    }));
    void parseGviz;
    return rowsToPrograms(rows);
  } catch {
    return [];
  }
}
