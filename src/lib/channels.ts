export type Category = 'nasional' | 'paytv' | 'internasional';

export interface Channel {
  slug: string;
  name: string;
  category: Category;
  /** slug di tivie.id — kosong berarti hanya dari Spreadsheet */
  tivieSlug?: string;
  /**
   * id provider sumber (lihat src/lib/providers/index.ts): 'tivie' | 'vidio' | 'mncvision' | 'singtel'.
   * Default: 'tivie' bila ada tivieSlug/providerRef.
   */
  provider?: string;
  /** id/slug channel di situs provider (default = tivieSlug). Kosong = khusus Spreadsheet. */
  providerRef?: string;
  logo?: string;
  description?: string;
  /** true = selalu diurutkan paling atas (dipakai untuk Animax & ANIPLUS). */
  featured?: boolean;
}

const logoBase = 'https://i0.wp.com/is3.cloudhost.id/tivie/channel/';
const logo = (f: string) => `${logoBase}${f}?w=120&h=120`;

export const CHANNELS: Channel[] = [
  // Unggulan — selalu teratas di semua daftar
  { slug: 'animax', name: 'Animax', category: 'paytv', provider: 'singtel', providerRef: '5342', logo: '/logos/animax.png', featured: true },
  { slug: 'aniplus', name: 'ANIPLUS HD', category: 'paytv', provider: 'singtel', providerRef: '5340', logo: '/logos/aniplus.png', featured: true },
  { slug: 'antv', name: 'ANTV', category: 'nasional', tivieSlug: 'antv', provider: 'mncvision', providerRef: '115', logo: '/logos/antv.png' },
  { slug: 'btv', name: 'BTV', category: 'nasional', tivieSlug: 'btv', provider: 'mncvision', providerRef: '103', logo: '/logos/btv.png' },
  { slug: 'cnn-indonesia', name: 'CNN Indonesia', category: 'nasional', tivieSlug: 'cnnindonesia', logo: '/logos/cnn-indonesia.png' },
  { slug: 'garuda-tv', name: 'Garuda TV', category: 'nasional', tivieSlug: 'garudatv', logo: '/logos/garuda-tv.png' },
  { slug: 'gtv', name: 'GTV', category: 'nasional', tivieSlug: 'gtv', provider: 'mncvision', providerRef: '81', logo: '/logos/gtv.png' },
  { slug: 'indosiar', name: 'Indosiar', category: 'nasional', tivieSlug: 'indosiar', provider: 'mncvision', providerRef: '78', logo: '/logos/indosiar.png' },
  { slug: 'inews', name: 'iNews', category: 'nasional', tivieSlug: 'inews', provider: 'mncvision', providerRef: '83', logo: '/logos/inews.png' },
  { slug: 'kompas-tv', name: 'Kompas TV', category: 'nasional', tivieSlug: 'kompastv', provider: 'mncvision', providerRef: '106', logo: '/logos/kompas-tv.png' },
  { slug: 'mdtv', name: 'MDTV', category: 'nasional', tivieSlug: 'mdtv', provider: 'mncvision', providerRef: '116', logo: '/logos/mdtv.png' },
  { slug: 'mentari-tv', name: 'Mentari TV', category: 'nasional', tivieSlug: 'mentaritv', logo: '/logos/mentari-tv.png' },
  { slug: 'metro-tv', name: 'Metro TV', category: 'nasional', tivieSlug: 'metrotv', provider: 'mncvision', providerRef: '107', logo: '/logos/metro-tv.png' },
  { slug: 'mnctv', name: 'MNCTV', category: 'nasional', tivieSlug: 'mnctv', provider: 'mncvision', providerRef: '82', logo: '/logos/mnctv.png' },
  { slug: 'moji', name: 'Moji', category: 'nasional', tivieSlug: 'moji', logo: '/logos/moji.png' },
  { slug: 'nusantara-tv', name: 'Nusantara TV', category: 'nasional', tivieSlug: 'nusantaratv', logo: '/logos/nusantara-tv.png' },
  { slug: 'rcti', name: 'RCTI', category: 'nasional', tivieSlug: 'rcti', provider: 'mncvision', providerRef: '80', logo: '/logos/rcti.png' },
  { slug: 'rtv', name: 'RTV', category: 'nasional', tivieSlug: 'rtv', logo: '/logos/rtv.png' },
  { slug: 'sctv', name: 'SCTV', category: 'nasional', tivieSlug: 'sctv', provider: 'mncvision', providerRef: '89', logo: '/logos/sctv.png' },
  { slug: 'sinpo-tv', name: 'Sin Po TV', category: 'nasional', tivieSlug: 'sinpotv', logo: '/logos/sinpo-tv.png' },
  { slug: 'trans-tv', name: 'Trans TV', category: 'nasional', tivieSlug: 'transtv', provider: 'mncvision', providerRef: '87', logo: '/logos/trans-tv.png' },
  { slug: 'trans7', name: 'Trans7', category: 'nasional', tivieSlug: 'trans7', provider: 'mncvision', providerRef: '110', logo: '/logos/trans7.png' },
  { slug: 'tvone', name: 'TvOne', category: 'nasional', tivieSlug: 'tvone', provider: 'mncvision', providerRef: '97', logo: '/logos/tvone.png' },
  { slug: 'tvri', name: 'TVRI', category: 'nasional', tivieSlug: 'tvri', provider: 'mncvision', providerRef: '118', logo: '/logos/tvri.png' },
  { slug: 'vtv', name: 'VTV', category: 'nasional', tivieSlug: 'vtv', logo: '/logos/vtv.png' },
  { slug: 'sindonews-tv', name: 'Sindonews TV', category: 'nasional', tivieSlug: 'sindonews', provider: 'mncvision', providerRef: '84', logo: '/logos/sindonews-tv.png' },
  // Pay TV — full otomatis via MNC Vision (ID numerik dari mncvision.id/schedule/table)
  // kecuali HBO & ANIPLUS yang diambil dari Singtel (epgChannelId dari tv-programme-guide)
  { slug: 'hbo', name: 'HBO HD', category: 'paytv', provider: 'singtel', providerRef: '6420', logo: '/logos/hbo.png' },
  { slug: 'hbo-signature', name: 'HBO Signature', category: 'paytv', provider: 'singtel', providerRef: '6421', logo: '/logos/hbo-signature.png' },
  { slug: 'hbo-family', name: 'HBO Family', category: 'paytv', provider: 'singtel', providerRef: '6422', logo: '/logos/hbo-family.png' },
  { slug: 'hbo-hits', name: 'HBO Hits', category: 'paytv', provider: 'singtel', providerRef: '6423', logo: '/logos/hbo-hits.png' },
  { slug: 'bein-sports-1', name: 'beIN Sports 1', category: 'paytv', provider: 'mncvision', providerRef: '309', logo: '/logos/bein-sports-1.png' },
  { slug: 'bein-sports-2', name: 'beIN Sports 2', category: 'paytv', provider: 'mncvision', providerRef: '310', logo: '/logos/bein-sports-2.png' },
  { slug: 'bein-sports-3', name: 'beIN Sports 3', category: 'paytv', provider: 'mncvision', providerRef: '311', logo: '/logos/bein-sports-3.png' },
  { slug: 'spotv', name: 'SPOTV', category: 'paytv', provider: 'mncvision', providerRef: '307', logo: '/logos/spotv.png' },
  { slug: 'spotv-2', name: 'SPOTV 2', category: 'paytv', provider: 'mncvision', providerRef: '308', logo: '/logos/spotv-2.png' },
  { slug: 'axn', name: 'AXN', category: 'paytv', provider: 'mncvision', providerRef: '154', logo: '/logos/axn.png' },
  { slug: 'tvn', name: 'tvN', category: 'paytv', provider: 'mncvision', providerRef: '158', logo: '/logos/tvn.png' },
  { slug: 'kix', name: 'KIX', category: 'paytv', provider: 'mncvision', providerRef: '161', logo: '/logos/kix.png' },
  { slug: 'hits-movies', name: 'HITS Movies', category: 'paytv', provider: 'mncvision', providerRef: '11', logo: '/logos/hits-movies.png' },
  { slug: 'celestial-movies', name: 'Celestial Movies', category: 'paytv', provider: 'mncvision', providerRef: '20', logo: '/logos/celestial-movies.png' },
  { slug: 'studio-universal', name: 'Studio Universal', category: 'paytv', provider: 'mncvision', providerRef: '26', logo: '/logos/studio-universal.png' },
  { slug: 'tvn-movies', name: 'tvN Movies', category: 'paytv', provider: 'mncvision', providerRef: '25', logo: '/logos/tvn-movies.png' },
  { slug: 'rock-action', name: 'Rock Action', category: 'paytv', provider: 'mncvision', providerRef: '248', logo: '/logos/rock-action.png' },
  { slug: 'rock-entertainment', name: 'Rock Entertainment', category: 'paytv', provider: 'mncvision', providerRef: '240', logo: '/logos/rock-entertainment.png' },
  // Internasional — full otomatis via MNC Vision
  { slug: 'al-jazeera', name: 'Al Jazeera English', category: 'internasional', provider: 'mncvision', providerRef: '331', logo: '/logos/al-jazeera.png' },
  { slug: 'bbc-news', name: 'BBC World News', category: 'internasional', provider: 'mncvision', providerRef: '332', logo: '/logos/bbc-news.png' },
  { slug: 'nhk-world', name: 'NHK World', category: 'internasional', provider: 'mncvision', providerRef: '355', logo: '/logos/nhk-world.png' },
  { slug: 'cna', name: 'CNA', category: 'internasional', provider: 'mncvision', providerRef: '330', logo: '/logos/cna.png' },
  { slug: 'abc-australia', name: 'ABC Australia', category: 'internasional', provider: 'mncvision', providerRef: '350', logo: '/logos/abc-australia.png' },
  { slug: 'arirang', name: 'Arirang', category: 'internasional', provider: 'mncvision', providerRef: '351', logo: '/logos/arirang.png' },
  { slug: 'dw', name: 'DW English', category: 'internasional', provider: 'mncvision', providerRef: '357', logo: '/logos/dw.png' },
  { slug: 'france24', name: 'France 24 English', category: 'internasional', provider: 'mncvision', providerRef: '352', logo: '/logos/france24.png' },
  { slug: 'euronews', name: 'Euronews', category: 'internasional', provider: 'mncvision', providerRef: '333', logo: '/logos/euronews.png' },
  { slug: 'bloomberg', name: 'Bloomberg', category: 'internasional', provider: 'mncvision', providerRef: '338', logo: '/logos/bloomberg.png' },
  { slug: 'cnbc', name: 'CNBC', category: 'internasional', provider: 'mncvision', providerRef: '337', logo: '/logos/cnbc.png' },
  { slug: 'cgtn', name: 'CGTN', category: 'internasional', provider: 'mncvision', providerRef: '353', logo: '/logos/cgtn.png' },
  // Contoh channel dari provider lain — aktifkan setelah provider diimplementasikan
  // (lihat src/lib/providers/*.ts):
  // { slug: 'rcti-vidio', name: 'RCTI (Vidio)', category: 'nasional', provider: 'vidio', providerRef: '665' },
];

export const CATEGORIES: { slug: Category; name: string; description: string }[] = [
  { slug: 'nasional', name: 'TV Nasional', description: 'Jadwal stasiun TV nasional Indonesia (FTA / terestrial).' },
  { slug: 'paytv', name: 'Pay TV', description: 'Jadwal channel TV berbayar — dikelola manual via Spreadsheet.' },
  { slug: 'internasional', name: 'Internasional', description: 'Jadwal channel luar negeri — dikelola manual via Spreadsheet.' },
];

export function getChannel(slug: string): Channel | undefined {
  return CHANNELS.find((c) => c.slug === slug || c.tivieSlug === slug);
}

/** Label rapi untuk kategori (Nasional / Pay TV / Internasional). */
export function categoryLabel(cat: Category): string {
  return cat === 'nasional' ? 'Nasional' : cat === 'paytv' ? 'Pay TV' : 'Internasional';
}

/** Komparator: channel featured (Animax & ANIPLUS) selalu di atas, sisanya ikut urutan daftar. */
export function byFeatured(a: Channel, b: Channel): number {
  return Number(b.featured ?? false) - Number(a.featured ?? false);
}

export function channelsByCategory(cat: Category): Channel[] {
  return CHANNELS.filter((c) => c.category === cat).sort(byFeatured);
}
