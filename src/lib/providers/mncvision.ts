import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import type { Provider } from './types';

// STUB — belum diimplementasikan.
// Langkah implementasi:
// 1. Cari halaman jadwal resmi MNC Vision / MNC Play (jadwal pay-TV MNC Group).
// 2. Cek apakah ada JSON-LD (seperti tivie.id) atau JSON API di balik halamannya.
// 3. Petakan ke EpgProgram (contoh lengkap di providers/tivie.ts).
// 4. Daftarkan channel di channels.ts: { provider: 'mncvision', providerRef: '<id>' }.
export const mncvisionProvider: Provider = {
  id: 'mncvision',
  name: 'MNC Vision',
  supportsDates: false,
  async fetchChannel(_channel: Channel, _dateISO: string): Promise<EpgProgram[]> {
    return [];
  },
};
