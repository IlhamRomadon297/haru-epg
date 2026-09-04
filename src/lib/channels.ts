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
  // Pay TV — data via Spreadsheet (manual), bisa ditambah tivieSlug bila tersedia
  { slug: 'hbo', name: 'HBO', category: 'paytv' },
  { slug: 'cinemax', name: 'Cinemax', category: 'paytv' },
  { slug: 'bein-sports-1', name: 'beIN Sports 1', category: 'paytv' },
  { slug: 'spotv', name: 'SPOTV', category: 'paytv' },
  { slug: 'animax', name: 'Animax', category: 'paytv' },
  // Internasional
  { slug: 'bbc-news', name: 'BBC News', category: 'internasional' },
  { slug: 'cnn-intl', name: 'CNN International', category: 'internasional' },
  { slug: 'al-jazeera', name: 'Al Jazeera', category: 'internasional' },
  { slug: 'nhk-world', name: 'NHK World', category: 'internasional' },
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
