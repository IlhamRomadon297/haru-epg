import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import type { Provider } from './types';

// STUB — belum diimplementasikan. Jejak riset (Sep 2026):
// - Halaman: https://www.vidio.com/live (Next.js, HTTP 200, butuh UA browser)
// - Link jadwal: /live/{id}?schedule_id={n} — cth RCTI livestream id 665
// - API: https://api.vidio.com (terdaftar sebagai dns-prefetch di halaman live)
// - Gambar livestream memuat ID channel: .../uploads/livestreaming/square_image/205/...
// Langkah implementasi:
// 1. Buka https://www.vidio.com/live/{id} → cari JSON jadwal (script __NEXT__ / RSC payload)
//    atau endpoint api.vidio.com untuk jadwal livestream (cek tab Network browser).
// 2. Petakan ke EpgProgram: contoh lengkap di providers/tivie.ts
//    (id, channelSlug, date, start/end ISO +07:00, startLabel/endLabel "HH:MM WIB",
//     title, description, slug via programSlug()).
// 3. Daftarkan channel di channels.ts: { provider: 'vidio', providerRef: '<id>' }.
export const vidioProvider: Provider = {
  id: 'vidio',
  name: 'Vidio.com',
  supportsDates: false,
  async fetchChannel(_channel: Channel, _dateISO: string): Promise<EpgProgram[]> {
    return [];
  },
};
