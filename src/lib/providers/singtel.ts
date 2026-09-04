import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import type { Provider } from './types';

// STUB — belum diimplementasikan. Catatan riset (Sep 2026):
// - URL guide lama (.../tv/packs-channels/tv-guide) sudah 404 — Singtel mengubah struktur situs.
// - Langkah: cari URL TV Guide terbaru via pencarian "Singtel TV Guide" / sitemap singtel.com,
//   lalu cek JSON API di baliknya (biasanya endpoint guide dengan param date + channel id).
// - Petakan ke EpgProgram (contoh lengkap di providers/tivie.ts).
// - Daftarkan channel di channels.ts: { provider: 'singtel', providerRef: '<id>' }.
export const singtelProvider: Provider = {
  id: 'singtel',
  name: 'Singtel TV',
  supportsDates: false,
  async fetchChannel(_channel: Channel, _dateISO: string): Promise<EpgProgram[]> {
    return [];
  },
};
