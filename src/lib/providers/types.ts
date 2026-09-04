import type { Channel } from '../channels';
import type { EpgProgram } from '../types';

/**
 * Kontrak satu sumber jadwal (provider).
 * Untuk menambah provider baru, cukup implement interface ini di file baru —
 * tidak perlu menyentuh epg.ts / halaman / caching (dispatch + cache otomatis).
 */
export interface Provider {
  /** id unik, dipakai di `Channel.provider` (mis. 'tivie', 'vidio') */
  id: string;
  /** nama tampil untuk log/debug */
  name: string;
  /** true bila bisa mengambil tanggal arsip/mendatang, false bila hanya "hari ini" */
  supportsDates: boolean;
  /**
   * Ambil jadwal 1 channel untuk tanggal WIB YYYY-MM-DD.
   * Kembalikan [] bila gagal — JANGAN throw (situs harus tetap jalan).
   * `channel.providerRef` = id/slug channel di situs provider tersebut.
   */
  fetchChannel(channel: Channel, dateISO: string): Promise<EpgProgram[]>;
}
