# 📺 Haru EPG — Jadwal TV Indonesia

Website **Electronic Program Guide (EPG)** untuk jadwal acara TV Indonesia: **TV Nasional, Pay TV, dan Internasional** — lengkap dengan status 🔴 **LIVE**, navigasi tanggal (arsip H-3 s/d H+10), pencarian, filter kategori, dark mode, dan tampilan mobile-first.

🌐 **Live:** https://haru-epg.pages.dev

## ✨ Fitur

- 📅 Timeline jadwal per channel (hari ini, kemarin, besok, arsip H-3, depan H+10)
- 🔴 Badge **LIVE** + progress bar acara yang sedang tayang
- 🔍 Pencarian acara & channel (`/cari?q=...`)
- 🗂️ Filter kategori: Nasional / Pay TV / Internasional
- 📄 Halaman channel, detail acara, dan API JSON (`/api/schedule`, `/api/channel/[slug]`, `/api/search`)
- 🌙 Dark mode (toggle + otomatis ikut sistem)
- 📱 Responsive mobile-first
- ⚡ Full otomatis: scrape terjadwal tiap 2 jam ke Cloudflare D1, situs baca D1 (instan)

## 🏗️ Arsitektur

```
[tivie.id | MNC Vision | Singtel TV] ──scrape──▶ [Worker cron tiap 2 jam] ──▶ [Cloudflare D1]
                                                                                    │
Pengunjung ──▶ [Astro SSR di Cloudflare Pages] ──▶ D1 dulu, fallback scrape live ──▶ Cache API
```

| Sumber | Cakupan | Keterangan |
|---|---|---|
| `tivie.id` | 24 channel nasional | Parse JSON-LD `BroadcastEvent` |
| MNC Vision (`mncvision.id/schedule/table`) | 22 channel pay TV & internasional | POST form per channel + tanggal |
| Singtel TV | HBO (4 ch), ANIPLUS HD, Animax | JSON harian `{DDMMYYYY}.json`, waktu SGT dikonversi ke WIB |

## 📁 Struktur Proyek

```
src/
  lib/
    providers/        # Satu file per sumber (tivie.ts, mncvision.ts, singtel.ts, vidio.ts)
    providers/index.ts# Registry + dispatcher (tambah provider = daftar di sini)
    channels.ts       # Daftar channel (slug, kategori, provider, providerRef, logo)
    epg.ts            # getDaySchedule: Cache → D1 → scrape live (write-through)
    store.ts          # Akses D1 (baca/tulis/prune)
    sync.ts           # fetchAllPrograms: gabung semua provider (+ override Sheet opsional)
    sheets.ts         # Override manual via Google Spreadsheet (opsional, butuh GOOGLE_SHEET_ID)
  pages/              # /, /channel/[slug], /program/[slug], /kategori/[slug], /cari
  pages/api/          # /api/schedule, /api/channel/[slug], /api/search
  components/DateNav.astro  # Navigasi ◀ Kemarin / Hari ini / Besok ▶
worker/cron.ts        # Cron tiap 2 jam: sync hari ini + besok + 1 tanggal rotasi
migrations/           # Skema D1
tools/                # Skrip probe riset + generator contoh seed
```

## 🚀 Jalankan Lokal

```bash
npm install
npm run dev
```

> Catatan: tanpa binding D1 lokal, situs otomatis memakai jalur **scrape live** (lebih lambat saat pertama dimuat, lalu di-cache).

## ☁️ Deploy (Cloudflare)

```bash
# 1) Database (sekali saja)
npx wrangler d1 create haru-epg
npx wrangler d1 execute haru-epg --remote --file=migrations/0001_init.sql

# 2) Web (Pages)
npx astro build
npx wrangler pages deploy ./dist --project-name=haru-epg

# 3) Cron worker
npx wrangler deploy --config worker/wrangler.cron.toml

# 4) Sync manual pertama (opsional, cron jalan sendiri tiap 2 jam)
#    /sync?key=ISI_CRONT_KEY&date=YYYY-MM-DD di URL worker
```

Secrets yang dipakai worker cron (via `wrangler secret put --config worker/wrangler.cron.toml`):

| Secret | Wajib | Fungsi |
|---|---|---|
| `CRON_KEY` | Ya | Kunci endpoint `/sync` manual |
| `GOOGLE_SHEET_ID` | Tidak | Override manual via Spreadsheet (kosong = full scrape) |

## ➕ Tambah Channel / Provider Baru

**Channel baru dari sumber yang sudah ada** — 1 baris di `src/lib/channels.ts`:

```ts
{ slug: 'contoh-tv', name: 'Contoh TV', category: 'paytv', provider: 'mncvision', providerRef: '123' },
```

`providerRef` = ID channel di situs sumber (MNC: angka `fchannel`, Singtel: `epgChannelId`, tivie: slug).

**Sumber baru** (lihat `src/lib/providers/index.ts`, 4 langkah, sudah ada contoh `vidio.ts`):

1. Buat `src/lib/providers/namaku.ts` yang export `namakuProvider: Provider` (contek `tivie.ts`)
2. Daftarkan di `PROVIDERS`
3. Pasang `provider` + `providerRef` di channel
4. Selesai — halaman, API, D1, cron, dan cache otomatis mengikutinya

## ⚖️ Disclaimer

Jadwal dapat berubah sewaktu-waktu tergantung kebijakan stasiun televisi. Data diambil ulang dari tivie.id, MNC Vision, dan Singtel TV untuk kemudahan. Jadwal Singtel (zona Singapura) dikonversi ke WIB.

## 🛠️ Tech Stack

Astro 5 (SSR) · Cloudflare Pages + Workers + D1 · TypeScript · Zero-framework CSS (dark mode via CSS variables)
