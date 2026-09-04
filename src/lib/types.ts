import type { Category } from './channels';

export interface EpgProgram {
  /** id unik stabil: `${channelSlug}-${startISO}` */
  id: string;
  channelSlug: string;
  channelName: string;
  /** tanggal YYYY-MM-DD (WIB) */
  date: string;
  /** ISO 8601 dengan offset +07:00 */
  start: string;
  end: string;
  /** jam tampil "HH:MM WIB" */
  startLabel: string;
  endLabel: string;
  title: string;
  category?: string;
  description?: string;
  /** slug detail tivie.id (/program/xxx atau /film/xxx) bila ada */
  sourceSlug?: string;
  sourceKind?: 'program' | 'film';
  /** slug internal untuk /program/[slug] */
  slug: string;
  /** true bila dari Google Spreadsheet (manual override) */
  manual?: boolean;
}

export interface ChannelSchedule {
  slug: string;
  name: string;
  category: Category;
  logo?: string;
  programs: EpgProgram[];
  now?: EpgProgram | null;
  next?: EpgProgram | null;
}

export interface DaySchedule {
  date: string;
  label: string;
  channels: ChannelSchedule[];
  totalPrograms: number;
  cachedAt: string;
  source: 'live' | 'cache' | 'fallback' | 'd1';
}
