import type { Channel } from '../channels';
import type { EpgProgram } from '../types';
import type { Provider } from './types';

// STUB — belum diimplementasikan (endpoint terproteksi bot/Incapsula server-side).
// Hasil riset (Sep 2026), untuk implementasi via browser/proxy residential kelak:
// - Halaman: https://www.singtel.com/personal/products-services/tv/tv-programme-guide (HTTP 200)
// - Komponen <ux-tv-channel-epg datamodel="..."> berisi:
//     epgEndPoint: "/etc/singtel/public/tv/epg-parsed-data"
//     tvChannelLists[]: { title, channelId, epgChannelId, image, genre, language }
//     cth: Russia Today epgChannelId 5045, Ch 5 -> 5002, Ch 8 -> 5003
// - Coba: GET /etc/singtel/public/tv/epg-parsed-data?channelId={epgChannelId}
//   (redirect 301 ke dispatcher-prd5.www.prd.aws.sg.singtelgroup.net; butuh cookie/session browser)
// - Alternatif: tiru request persis browser (DevTools → Network → copy as fetch) lalu porting.
// - Daftarkan channel di channels.ts: { provider: 'singtel', providerRef: '<epgChannelId>' }.
export const singtelProvider: Provider = {
  id: 'singtel',
  name: 'Singtel TV',
  supportsDates: false,
  async fetchChannel(_channel: Channel, _dateISO: string): Promise<EpgProgram[]> {
    return [];
  },
};
