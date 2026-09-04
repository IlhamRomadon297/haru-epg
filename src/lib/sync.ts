import { CHANNELS } from './channels';
import { fetchProviderSchedules, providerRefOf } from './providers/index';
import { fetchSheetOverrides, type SheetEnv } from './sheets';
import type { EpgProgram } from './types';

/** Gabung data scrape + override sheet (manual menang bila channel+start sama). */
export function mergePrograms(
  scraped: EpgProgram[],
  sheet: EpgProgram[],
  date: string,
): EpgProgram[] {
  const byDate = sheet.filter((p) => p.date === date);
  const overridden = new Set(byDate.map((p) => `${p.channelSlug}|${p.start}`));
  const kept = scraped.filter((p) => !overridden.has(`${p.channelSlug}|${p.start}`));
  return [...kept, ...byDate].sort((a, b) =>
    a.channelSlug === b.channelSlug
      ? a.start.localeCompare(b.start)
      : a.channelSlug.localeCompare(b.channelSlug),
  );
}

/**
 * Ambil SEMUA program 1 tanggal dari semua provider + sheet.
 * Dipakai oleh cron worker (tulis ke D1) dan fallback live di epg.ts.
 */
export async function fetchAllPrograms(env: SheetEnv, date: string): Promise<EpgProgram[]> {
  const fetchable = CHANNELS.filter((c) => providerRefOf(c) !== '');
  const [sheet, provMap] = await Promise.all([
    fetchSheetOverrides(env, date),
    fetchProviderSchedules(fetchable, date).catch(() => new Map<string, EpgProgram[]>()),
  ]);
  return mergePrograms([...provMap.values()].flat(), sheet, date);
}
