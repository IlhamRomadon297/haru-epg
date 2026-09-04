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
}

const logoBase = 'https://i0.wp.com/is3.cloudhost.id/tivie/channel/';
const logo = (f: string) => `${logoBase}${f}?w=120&h=120`;

export const CHANNELS: Channel[] = [
  { slug: 'antv', name: 'ANTV', category: 'nasional', tivieSlug: 'antv', logo: logo('YcwYQyql9CXniHlugQEaKNt7SmUNA9C8wajaWluo.png') },
  { slug: 'btv', name: 'BTV', category: 'nasional', tivieSlug: 'btv', logo: logo('ouHjfljSaPJbIXiCDuWpueKhzwXsjZffnHCu2MPU.png') },
  { slug: 'cnn-indonesia', name: 'CNN Indonesia', category: 'nasional', tivieSlug: 'cnnindonesia', logo: logo('0kONuTn3l5nyiaXNzUD8PkcVJ3KzW77Rr0dVJXKl.png') },
  { slug: 'garuda-tv', name: 'Garuda TV', category: 'nasional', tivieSlug: 'garudatv', logo: logo('eoJWUOQ2IwvoxZQLruU9nRQmoB6Zq2JloDC368ry.png') },
  { slug: 'gtv', name: 'GTV', category: 'nasional', tivieSlug: 'gtv', logo: logo('2rxBtLwvNfFCPAIh9QO9xb4DhrfRVFvBqDa0WkKP.png') },
  { slug: 'indosiar', name: 'Indosiar', category: 'nasional', tivieSlug: 'indosiar', logo: logo('78gjGX7MXIIjHtkRfLMkL3SVWkOS1YCUJnfvM6mU.png') },
  { slug: 'inews', name: 'iNews', category: 'nasional', tivieSlug: 'inews', logo: logo('A1neyMyyenFNiu7xvKs7EGh1V79J7vLKCEi7NLCA.png') },
  { slug: 'kompas-tv', name: 'Kompas TV', category: 'nasional', tivieSlug: 'kompastv', logo: logo('rTo9S0kVnTIFEDNOnZpN8Iwk0FLtYeMEcQ4Nd9nq.png') },
  { slug: 'mdtv', name: 'MDTV', category: 'nasional', tivieSlug: 'mdtv', logo: logo('Lgu7coLBxNFLUXnABSGH8cEGomDz79ZQm4qMUcwr.png') },
  { slug: 'mentari-tv', name: 'Mentari TV', category: 'nasional', tivieSlug: 'mentaritv', logo: logo('TPgQNcz5ZYS8r0Gu20D4y84mGRvXovBlUHoM43Nf.png') },
  { slug: 'metro-tv', name: 'Metro TV', category: 'nasional', tivieSlug: 'metrotv', logo: logo('npwegJNO7Q2jrqfhxIpHamD66PJGzhVzYxsCJePj.png') },
  { slug: 'mnctv', name: 'MNCTV', category: 'nasional', tivieSlug: 'mnctv', logo: logo('796l5aHuo4L15YxBkBcqtpsCoSwNTXtSlZNxieXp.png') },
  { slug: 'moji', name: 'Moji', category: 'nasional', tivieSlug: 'moji', logo: logo('7GvIDgLzCD5y7aUPOHBc9ToTzPf0A3Fy5zRFkI1S.png') },
  { slug: 'nusantara-tv', name: 'Nusantara TV', category: 'nasional', tivieSlug: 'nusantaratv', logo: logo('3C9PojbLyoLf6nvR4lrPeI6axSGeHwfAAwXvxGDd.png') },
  { slug: 'rcti', name: 'RCTI', category: 'nasional', tivieSlug: 'rcti', logo: logo('xs1WvCTI8CBiAlPWhcMK9OI2PxxIbwV9eneps08K.png') },
  { slug: 'rtv', name: 'RTV', category: 'nasional', tivieSlug: 'rtv', logo: logo('28bjZF7ogxpmzglTONVLtE6L5cQp9it4Kr6xAR5w.png') },
  { slug: 'sctv', name: 'SCTV', category: 'nasional', tivieSlug: 'sctv', logo: logo('f1AU02SyUlsUy86Dy8KSjdX92E4YjXPQDjWHL7Ey.png') },
  { slug: 'sinpo-tv', name: 'Sin Po TV', category: 'nasional', tivieSlug: 'sinpotv', logo: logo('Moqav0dDQZ3HNslRsD3cCabStBpOsg4JbgfMkVaO.png') },
  { slug: 'trans-tv', name: 'Trans TV', category: 'nasional', tivieSlug: 'transtv', logo: logo('yjB7oMqNbF96glayEWNfFX6GenUDt2STtOkFeT5F.png') },
  { slug: 'trans7', name: 'Trans7', category: 'nasional', tivieSlug: 'trans7', logo: logo('amnYF03HkFucMQonA4Kgrz7nPL4Is0pz0f03dvrQ.png') },
  { slug: 'tvone', name: 'TvOne', category: 'nasional', tivieSlug: 'tvone', logo: logo('Uaep3l3FOpvB7WtMu1xQfBvqoqyB8S2ufhdfJURB.png') },
  { slug: 'tvri', name: 'TVRI', category: 'nasional', tivieSlug: 'tvri', logo: logo('XELJMrsGwfckbQ9AlilBa7BdWqmLrvF0DF3PoVKn.png') },
  { slug: 'vtv', name: 'VTV', category: 'nasional', tivieSlug: 'vtv', logo: logo('j3W5E19JVcaaKdNEVK3gss55n8pIpxE82ahs8zmn.png') },
  { slug: 'sindonews-tv', name: 'Sindonews TV', category: 'nasional', tivieSlug: 'sindonews' },
  // Pay TV — full otomatis via MNC Vision (ID numerik dari mncvision.id/schedule/table)
  // kecuali HBO & ANIPLUS yang diambil dari Singtel (epgChannelId dari tv-programme-guide)
  { slug: 'hbo', name: 'HBO HD', category: 'paytv', provider: 'singtel', providerRef: '6420', logo: 'https://www.singtel.com/content/dam/singtel/personal/products-services/tv/channel/logo/hbp_HB.png' },
  { slug: 'hbo-signature', name: 'HBO Signature', category: 'paytv', provider: 'singtel', providerRef: '6421', logo: 'https://www.singtel.com/content/dam/singtel/personal/products-services/tv/channel/logo/CH%20421%20-%20hbo_SIG.PNG' },
  { slug: 'hbo-family', name: 'HBO Family', category: 'paytv', provider: 'singtel', providerRef: '6422', logo: 'https://www.singtel.com/content/dam/singtel/personal/products-services/tv/channel/logo/CH%20422%20-%20hbo_FAM.PNG' },
  { slug: 'hbo-hits', name: 'HBO Hits', category: 'paytv', provider: 'singtel', providerRef: '6423', logo: 'https://www.singtel.com/content/dam/singtel/personal/products-services/tv/channel/logo/CH%20423%20-%20hbo_HITS.PNG' },
  { slug: 'aniplus', name: 'ANIPLUS HD', category: 'paytv', provider: 'singtel', providerRef: '5340', logo: 'https://www.singtel.com/content/dam/singtel/online-draft/chlogos/CH%20340%20-%20ANIPLUS.png' },
  { slug: 'animax', name: 'Animax', category: 'paytv', provider: 'singtel', providerRef: '5342', logo: 'https://www.singtel.com/content/dam/singtel/online-draft/chlogos/CH%20342%20-%20ANIMAX.png' },
  { slug: 'bein-sports-1', name: 'beIN Sports 1', category: 'paytv', provider: 'mncvision', providerRef: '309', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_309.png' },
  { slug: 'bein-sports-2', name: 'beIN Sports 2', category: 'paytv', provider: 'mncvision', providerRef: '310', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_310.png' },
  { slug: 'bein-sports-3', name: 'beIN Sports 3', category: 'paytv', provider: 'mncvision', providerRef: '311', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_311.png' },
  { slug: 'spotv', name: 'SPOTV', category: 'paytv', provider: 'mncvision', providerRef: '307', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_307.png' },
  { slug: 'spotv-2', name: 'SPOTV 2', category: 'paytv', provider: 'mncvision', providerRef: '308', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_308.png' },
  { slug: 'axn', name: 'AXN', category: 'paytv', provider: 'mncvision', providerRef: '154', logo: 'https://www.mncvision.id/userfiles/image/channel/axn_150x150.jpg' },
  { slug: 'tvn', name: 'tvN', category: 'paytv', provider: 'mncvision', providerRef: '158', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_158.png' },
  { slug: 'kix', name: 'KIX', category: 'paytv', provider: 'mncvision', providerRef: '161', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_161.png' },
  { slug: 'hits-movies', name: 'HITS Movies', category: 'paytv', provider: 'mncvision', providerRef: '11', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_169.png' },
  { slug: 'celestial-movies', name: 'Celestial Movies', category: 'paytv', provider: 'mncvision', providerRef: '20', logo: 'https://www.mncvision.id/userfiles/image/channel/celestial.png' },
  { slug: 'studio-universal', name: 'Studio Universal', category: 'paytv', provider: 'mncvision', providerRef: '26', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_26.png' },
  { slug: 'tvn-movies', name: 'tvN Movies', category: 'paytv', provider: 'mncvision', providerRef: '25', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_25.png' },
  { slug: 'rock-action', name: 'Rock Action', category: 'paytv', provider: 'mncvision', providerRef: '248', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_248.png' },
  { slug: 'rock-entertainment', name: 'Rock Entertainment', category: 'paytv', provider: 'mncvision', providerRef: '240', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_240.png' },
  // Internasional — full otomatis via MNC Vision
  { slug: 'al-jazeera', name: 'Al Jazeera English', category: 'internasional', provider: 'mncvision', providerRef: '331', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_331.png' },
  { slug: 'bbc-news', name: 'BBC World News', category: 'internasional', provider: 'mncvision', providerRef: '332', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_332.png' },
  { slug: 'nhk-world', name: 'NHK World', category: 'internasional', provider: 'mncvision', providerRef: '355', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_355.jpeg' },
  { slug: 'cna', name: 'CNA', category: 'internasional', provider: 'mncvision', providerRef: '330', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_330.png' },
  { slug: 'abc-australia', name: 'ABC Australia', category: 'internasional', provider: 'mncvision', providerRef: '350', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_350.png' },
  { slug: 'arirang', name: 'Arirang', category: 'internasional', provider: 'mncvision', providerRef: '351', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_351.png' },
  { slug: 'dw', name: 'DW English', category: 'internasional', provider: 'mncvision', providerRef: '357', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_357.png' },
  { slug: 'france24', name: 'France 24 English', category: 'internasional', provider: 'mncvision', providerRef: '352', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_352.png' },
  { slug: 'euronews', name: 'Euronews', category: 'internasional', provider: 'mncvision', providerRef: '333', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_333.png' },
  { slug: 'bloomberg', name: 'Bloomberg', category: 'internasional', provider: 'mncvision', providerRef: '338', logo: 'https://www.mncvision.id/userfiles/image/channel/bloomberg.png' },
  { slug: 'cnbc', name: 'CNBC', category: 'internasional', provider: 'mncvision', providerRef: '337', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_337.png' },
  { slug: 'cgtn', name: 'CGTN', category: 'internasional', provider: 'mncvision', providerRef: '353', logo: 'https://www.mncvision.id/userfiles/image/channel/channel_353.png' },
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

export function channelsByCategory(cat: Category): Channel[] {
  return CHANNELS.filter((c) => c.category === cat);
}
