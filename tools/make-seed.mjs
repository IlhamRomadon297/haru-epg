// Contoh isi Google Sheet Haru EPG — INERT (tanggal lampau, tidak tampil di situs).
// Semua channel kini full-otomatis via scraper (tivie.id + MNC Vision), jadi Sheet
// hanya untuk OVERRIDE MANUAL bila diperlukan.
// Cara pakai: ganti Tanggal ke tanggal nyata / "Harian" / nama hari (Senin..Minggu),
// lalu File → Import → Upload sheet-seed.csv → "Append to current sheet".
// Kolom Tanggal mendukung: YYYY-MM-DD, "Harian", atau "Senin".."Minggu" (berulang tiap pekan).
import { writeFileSync } from 'node:fs';

const q = (v) => {
  v = String(v);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

// Baris CONTOH bertanggal lampau — aman, tidak akan tampil sebelum Tanggal diganti.
const rows = [
  ['Channel', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Judul Acara', 'Kategori', 'Deskripsi'],
  ['RCTI', '2026-01-01', '19:00', '20:30', 'CONTOH Override Sinetron', 'Sinetron', 'CONTOH: baris ini menimpa jadwal scrape bila Tanggal diganti ke tanggal nyata. Hapus baris ini bila tidak perlu.'],
  ['Animax', '2026-01-01', '20:00', '20:30', 'CONTOH Override Anime', 'Anime', 'CONTOH: override untuk channel MNC Vision.'],
  ['Kanal Saya', '2026-01-01', '18:00', '19:00', 'CONTOH Channel Baru', 'Hiburan', 'CONTOH: nama channel yang belum terdaftar akan otomatis muncul sebagai channel baru.'],
];

writeFileSync(new URL('./sheet-seed.csv', import.meta.url), '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\n'));
console.log(`OK: ${rows.length - 1} baris contoh (inert) → tools/sheet-seed.csv`);
