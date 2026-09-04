import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import { tivieProvider } from './tivie';
import { vidioProvider } from './vidio';
import { mncvisionProvider } from './mncvision';
import { singtelProvider } from './singtel';
import type { Provider } from './types';

// ============================================================
// CARA NAMBAH SUMBER SCRAPE BARU (contoh: provider "viu"):
// 1. Buat file src/lib/providers/viu.ts yang export `viuProvider: Provider`
//    (contek vidio.ts untuk stub / tivie.ts untuk implementasi penuh).
// 2. Daftarkan di PROVIDERS di bawah.
// 3. Di channels.ts, pasang `provider: 'viu', providerRef: '<id channel>'`.
// 4. SELESAI — epg.ts, halaman, API, dan cache otomatis memakai provider baru.
// ============================================================
export const PROVIDERS: Record<string, Provider> = {
  tivie: tivieProvider,
  vidio: vidioProvider,
  mncvision: mncvisionProvider,
  singtel: singtelProvider,
};

/** Provider untuk satu channel (default 'tivie' bila ada tivieSlug/providerRef). */
export function getProvider(channel: Channel): Provider {
  if (channel.provider && PROVIDERS[channel.provider]) return PROVIDERS[channel.provider];
  return tivieProvider;
}

/** Id/slug channel di situs provider. Kosong = channel khusus Spreadsheet (tidak di-scrape). */
export function providerRefOf(channel: Channel): string {
  return channel.providerRef ?? channel.tivieSlug ?? '';
}

/**
 * Fetch semua channel via provider masing-masing dengan batas konkurensi
 * agar tidak membanjiri situs sumber. Key hasil = channel.slug.
 */
export async function fetchProviderSchedules(
  channels: Channel[],
  dateISO: string,
  concurrency = 6,
): Promise<Map<string, EpgProgram[]>> {
  const out = new Map<string, EpgProgram[]>();
  let idx = 0;
  async function worker() {
    while (idx < channels.length) {
      const ch = channels[idx++];
      try {
        out.set(ch.slug, await getProvider(ch).fetchChannel(ch, dateISO));
      } catch {
        out.set(ch.slug, []);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(channels.length, 1)) }, worker),
  );
  return out;
}
