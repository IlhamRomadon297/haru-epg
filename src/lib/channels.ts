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
  { slug: 'animax', name: 'Animax', category: 'paytv', provider: 'mncvision', providerRef: '157' },
  { slug: 'bein-sports-1', name: 'beIN Sports 1', category: 'paytv', provider: 'mncvision', providerRef: '309' },
  { slug: 'bein-sports-2', name: 'beIN Sports 2', category: 'paytv', provider: 'mncvision', providerRef: '310' },
  { slug: 'bein-sports-3', name: 'beIN Sports 3', category: 'paytv', provider: 'mncvision', providerRef: '311' },
  { slug: 'spotv', name: 'SPOTV', category: 'paytv', provider: 'mncvision', providerRef: '307' },
  { slug: 'spotv-2', name: 'SPOTV 2', category: 'paytv', provider: 'mncvision', providerRef: '308' },
  { slug: 'axn', name: 'AXN', category: 'paytv', provider: 'mncvision', providerRef: '154' },
  { slug: 'tvn', name: 'tvN', category: 'paytv', provider: 'mncvision', providerRef: '158' },
  { slug: 'one', name: 'ONE', category: 'paytv', provider: 'mncvision', providerRef: '164' },
  { slug: 'kix', name: 'KIX', category: 'paytv', provider: 'mncvision', providerRef: '161' },
  { slug: 'hits-movies', name: 'HITS Movies', category: 'paytv', provider: 'mncvision', providerRef: '11' },
  { slug: 'celestial-movies', name: 'Celestial Movies', category: 'paytv', provider: 'mncvision', providerRef: '20' },
  { slug: 'studio-universal', name: 'Studio Universal', category: 'paytv', provider: 'mncvision', providerRef: '26' },
  { slug: 'tvn-movies', name: 'tvN Movies', category: 'paytv', provider: 'mncvision', providerRef: '25' },
  { slug: 'rock-action', name: 'Rock Action', category: 'paytv', provider: 'mncvision', providerRef: '248' },
  { slug: 'rock-entertainment', name: 'Rock Entertainment', category: 'paytv', provider: 'mncvision', providerRef: '240' },
  // Internasional — full otomatis via MNC Vision
  { slug: 'al-jazeera', name: 'Al Jazeera English', category: 'internasional', provider: 'mncvision', providerRef: '331' },
  { slug: 'bbc-news', name: 'BBC World News', category: 'internasional', provider: 'mncvision', providerRef: '332' },
  { slug: 'nhk-world', name: 'NHK World', category: 'internasional', provider: 'mncvision', providerRef: '355' },
  { slug: 'cna', name: 'CNA', category: 'internasional', provider: 'mncvision', providerRef: '330' },
  { slug: 'abc-australia', name: 'ABC Australia', category: 'internasional', provider: 'mncvision', providerRef: '350' },
  { slug: 'arirang', name: 'Arirang', category: 'internasional', provider: 'mncvision', providerRef: '351' },
  { slug: 'dw', name: 'DW English', category: 'internasional', provider: 'mncvision', providerRef: '357' },
  { slug: 'france24', name: 'France 24 English', category: 'internasional', provider: 'mncvision', providerRef: '352' },
  { slug: 'euronews', name: 'Euronews', category: 'internasional', provider: 'mncvision', providerRef: '333' },
  { slug: 'bloomberg', name: 'Bloomberg', category: 'internasional', provider: 'mncvision', providerRef: '338' },
  { slug: 'cnbc', name: 'CNBC', category: 'internasional', provider: 'mncvision', providerRef: '337' },
  { slug: 'cgtn', name: 'CGTN', category: 'internasional', provider: 'mncvision', providerRef: '353' },
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
