// Generator contoh isi Google Sheet Haru EPG (Pay TV + Internasional).
// Nasional tidak perlu diisi — otomatis dari tivie.id.
// Cara pakai: node tools/make-seed.mjs  →  hasil: tools/sheet-seed.csv
// Lalu di Google Sheets: File → Import → Upload sheet-seed.csv → "Append to current sheet".
import { writeFileSync } from 'node:fs';

const DAYS = ['2026-09-04', '2026-09-05', '2026-09-06'];

// Prime-time yang beda tiap hari (index = index hari)
const PRIME = {
  HBO: ['Deadpool & Wolverine', 'Dune: Part Two', 'Oppenheimer'],
  Cinemax: ['John Wick: Chapter 4', 'Fast X', 'The Equalizer 3'],
  Animax: ['Demon Slayer: Swordsmith Village Arc', 'Jujutsu Kaisen Season 2', 'One Piece: Egghead'],
};

// [mulai, selesai, judul, kategori, deskripsi]
const T = {
  HBO: [
    ['00:00', '02:45', 'Dune: Part Two', 'Film', 'Paul Atreides bersatu dengan Fremen untuk perang melawan House Harkonnen.'],
    ['02:45', '04:30', 'The Batman', 'Film', 'Batman mengungkap korupsi di Gotham saat memburu Riddler.'],
    ['04:30', '06:00', 'Succession S4 E3', 'Series', 'Keluarga Roy berebut kendali Waystar Royco.'],
    ['06:00', '08:00', 'The Super Mario Bros. Movie', 'Animasi', 'Mario dan Luigi bertualang di Mushroom Kingdom.'],
    ['08:00', '10:00', 'Wonka', 'Film', 'Kisah muda Willy Wonka merintis pabrik cokelat.'],
    ['10:00', '12:00', 'Aquaman and the Lost Kingdom', 'Film', 'Aquaman dan Orm bersatu melawan Black Manta.'],
    ['12:00', '14:00', 'Barbie', 'Film', 'Barbie pergi ke dunia nyata untuk menemukan jati diri.'],
    ['14:00', '16:30', 'Godzilla x Kong', 'Film', 'Dua titan bersatu melawan ancaman dari Hollow Earth.'],
    ['16:30', '18:00', 'Game of Thrones S1 E1', 'Series', 'Winter is Coming: awal perebutan Iron Throne.'],
    ['18:00', '19:00', 'The Last of Us S2 E1', 'Series', 'Joel dan Ellie menghadapi konflik baru di Jackson.'],
    ['19:00', '20:00', 'House of the Dragon S2 E1', 'Series', 'Perang saudara Targaryen memanas.'],
    ['20:00', '22:15', 'PRIME', 'Film', 'Film pilihan utama malam ini.'],
    ['22:15', '24:00', 'Joker: Folie à Deux', 'Film', 'Arthur Fleck bertemu Harley Quinn di Arkham.'],
  ],
  Cinemax: [
    ['00:00', '02:00', 'John Wick: Chapter 4', 'Film', 'John Wick melawan High Table di Osaka dan Paris.'],
    ['02:00', '04:00', 'Fast X', 'Film', 'Dom menghadapi dendam Dante Reyes.'],
    ['04:00', '06:00', 'The Equalizer 3', 'Film', 'Robert McCall beraksi di Italia Selatan.'],
    ['06:00', '08:00', 'The Meg 2', 'Film', 'Jonas Taylor melawan hiu raksasa di palung laut.'],
    ['08:00', '10:00', 'Extraction 2', 'Film', 'Tyler Rake menyelamatkan keluarga gangster Georgia.'],
    ['10:00', '12:00', 'Mission: Impossible - Dead Reckoning', 'Film', 'Ethan Hunt memburu senjata AI Entity.'],
    ['12:00', '14:00', 'Transformers: Rise of the Beasts', 'Film', 'Maximals dan Autobots melawan Unicron.'],
    ['14:00', '16:00', 'The Expendables 4', 'Film', 'Barney Ross dan tim melawan pedagang senjata.'],
    ['16:00', '18:00', 'The Beekeeper', 'Film', 'Mantan agen membalas sindikat penipuan.'],
    ['18:00', '20:00', 'Madame Web', 'Film', 'Cassandra Webb melihat masa depan dan melindungi tiga gadis.'],
    ['20:00', '22:00', 'PRIME', 'Film', 'Film laga pilihan utama malam ini.'],
    ['22:00', '24:00', 'Argylle', 'Film', 'Penulis mata-mata terseret konspirasi sungguhan.'],
  ],
  'beIN Sports 1': [
    ['00:00', '02:00', 'LaLiga Highlights', 'Olahraga', 'Rangkuman gol dan momen terbaik LaLiga pekan ini.'],
    ['02:00', '04:00', ' Ligue 1: PSG vs Marseille (Tunda)', 'Olahraga', 'Tayangan ulang Le Classique.'],
    ['04:00', '06:00', 'beIN Sports News', 'Berita', 'Kabar transfer dan hasil pertandingan semalam.'],
    ['06:00', '08:00', 'Serie A Preview', 'Olahraga', 'Pratinjau giornata Serie A akhir pekan.'],
    ['08:00', '10:00', 'UCL Magazine', 'Olahraga', 'Majalah Liga Champions: analisis dan wawancara.'],
    ['10:00', '12:00', 'LaLiga: Real Madrid vs Sevilla (Tunda)', 'Olahraga', 'Tayangan ulang Santiago Bernabeu.'],
    ['12:00', '14:00', 'Sports Talk Indonesia', 'Talkshow', 'Diskusi sepak bola bersama pengamat.'],
    ['14:00', '16:00', 'Serie A: Inter vs Juventus (Tunda)', 'Olahraga', 'Derby d\u2019Italia tayangan ulang.'],
    ['16:00', '18:00', 'ATP Tennis Highlights', 'Olahraga', 'Sorotan turnamen tenis ATP pekan ini.'],
    ['18:00', '20:00', 'Countdown to Kickoff', 'Olahraga', 'Bangun laga malam: statistik dan prediksi.'],
    ['20:00', '22:00', 'LaLiga Big Match (Live Look-in)', 'Olahraga', 'Laga pilihan LaLiga malam ini.'],
    ['22:00', '24:00', 'The Football Review', 'Olahraga', 'Ulasan pertandingan malam ini.'],
  ],
  SPOTV: [
    ['00:00', '02:00', 'MotoGP Highlights', 'Olahraga', 'Sorotan seri MotoGP terbaru.'],
    ['02:00', '04:00', 'BWF World Tour (Tunda)', 'Olahraga', 'Tayangan ulang bulutangkis dunia.'],
    ['04:00', '06:00', 'SPOTV News', 'Berita', 'Kabar olahraga Asia dan dunia.'],
    ['06:00', '08:00', 'Baseball KBO Highlights', 'Olahraga', 'Sorotan liga bisbol Korea.'],
    ['08:00', '10:00', 'MotoGP: Free Practice (Live)', 'Olahraga', 'Latihan bebas seri berjalan.'],
    ['10:00', '12:00', 'BWF Magazine', 'Olahraga', 'Profil pebulutangkis dan teknik.'],
    ['12:00', '14:00', 'One Championship (Tunda)', 'Olahraga', 'Laga MMA ONE Championship.'],
    ['14:00', '16:00', 'Table Tennis WTT', 'Olahraga', 'Tenis meja World Table Tennis.'],
    ['16:00', '18:00', 'MotoGP: Qualifying (Live)', 'Olahraga', 'Kualifikasi menentukan pole position.'],
    ['18:00', '20:00', 'Badminton Talk', 'Talkshow', 'Bincang bulutangkis Indonesia.'],
    ['20:00', '22:00', 'MotoGP Sprint (Live)', 'Olahraga', 'Balapan sprint seri berjalan.'],
    ['22:00', '24:00', 'Sports Center', 'Olahraga', 'Rangkuman olahraga hari ini.'],
  ],
  Animax: [
    ['00:00', '01:00', 'Naruto Shippuden', 'Anime', 'Naruto melawan Akatsuki.'],
    ['01:00', '02:00', 'One Piece', 'Anime', 'Luffy dan kru menuju Egghead.'],
    ['02:00', '04:00', 'Attack on Titan Final', 'Anime', 'Pertempuran akhir umat manusia.'],
    ['04:00', '06:00', 'Doraemon', 'Anime', 'Petualangan Nobita dan kantong ajaib.'],
    ['06:00', '07:00', 'Crayon Shinchan', 'Anime', 'Tingkah kocak Shinchan.'],
    ['07:00', '08:00', 'Detective Conan', 'Anime', 'Conan memecahkan kasus pembunuhan.'],
    ['08:00', '10:00', 'Spy x Family Season 2', 'Anime', 'Misi keluarga Forger berlanjut.'],
    ['10:00', '12:00', 'My Hero Academia Season 7', 'Anime', 'Deku dan kawan melawan All For One.'],
    ['12:00', '14:00', 'Frieren: Beyond Journey\u2019s End', 'Anime', 'Perjalanan elf Frieren setelah pahlawan.'],
    ['14:00', '16:00', 'Solo Leveling Season 2', 'Anime', 'Sung Jinwoo naik level di dungeon.'],
    ['16:00', '18:00', 'Haikyu!! The Dumpster Battle', 'Anime', 'Karasuno vs Nekoma di nationals.'],
    ['18:00', '20:00', 'PRIME', 'Anime', 'Anime pilihan utama malam ini.'],
    ['20:00', '22:00', 'Kaiju No. 8', 'Anime', 'Kafka melawan kaiju raksasa.'],
    ['22:00', '24:00', 'Jujutsu Kaisen', 'Anime', 'Yuji dan Gojo melawan kutukan.'],
  ],
  'BBC News': [
    ['00:00', '02:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['02:00', '03:00', 'Newsnight', 'Berita', 'Analisis mendalam isu global.'],
    ['03:00', '06:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['06:00', '07:00', 'Breakfast News Asia', 'Berita', 'Berita pagi Asia.'],
    ['07:00', '10:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['10:00', '11:00', 'HARDtalk', 'Talkshow', 'Wawancara tajam tokoh dunia.'],
    ['11:00', '14:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['14:00', '15:00', 'Click', 'Teknologi', 'Gadget dan tren teknologi.'],
    ['15:00', '18:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['18:00', '19:00', 'The World Today', 'Berita', 'Rangkuman berita hari ini.'],
    ['19:00', '22:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
    ['22:00', '23:00', 'Global Business', 'Berita', 'Berita ekonomi dan pasar dunia.'],
    ['23:00', '24:00', 'BBC World News', 'Berita', 'Berita internasional terkini.'],
  ],
  'CNN International': [
    ['00:00', '02:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
    ['02:00', '04:00', 'Amanpour', 'Talkshow', 'Wawancara Christiane Amanpour.'],
    ['04:00', '06:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
    ['06:00', '08:00', 'CNN This Morning', 'Berita', 'Berita pagi Amerika dan dunia.'],
    ['08:00', '10:00', 'First Move', 'Berita', 'Berita bisnis Asia-Eropa.'],
    ['10:00', '12:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
    ['12:00', '13:00', 'Connect the World', 'Berita', 'Berita Eropa dan Timur Tengah.'],
    ['13:00', '15:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
    ['15:00', '16:00', 'Quest Means Business', 'Berita', 'Bisnis global bersama Richard Quest.'],
    ['16:00', '19:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
    ['19:00', '20:00', 'The Lead', 'Berita', 'Berita utama hari ini.'],
    ['20:00', '22:00', 'Anderson Cooper 360', 'Berita', 'Sorotan mendalam isu Amerika dan dunia.'],
    ['22:00', '24:00', 'CNN Newsroom', 'Berita', 'Berita dunia terkini.'],
  ],
  'Al Jazeera': [
    ['00:00', '02:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['02:00', '03:00', 'The Listening Post', 'Berita', 'Kritik liputan media global.'],
    ['03:00', '06:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['06:00', '08:00', 'Morning News Asia', 'Berita', 'Berita pagi Asia.'],
    ['08:00', '10:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['10:00', '11:00', 'Inside Story', 'Talkshow', 'Bedah isu Timur Tengah.'],
    ['11:00', '14:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['14:00', '15:00', '101 East', 'Dokumenter', 'Dokumenter Asia Pasifik.'],
    ['15:00', '18:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['18:00', '19:00', 'Counting the Cost', 'Berita', 'Ekonomi global pekan ini.'],
    ['19:00', '22:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
    ['22:00', '23:00', 'UpFront', 'Talkshow', 'Debat isu global.'],
    ['23:00', '24:00', 'Newshour', 'Berita', 'Berita dunia dari Doha.'],
  ],
  'NHK World': [
    ['00:00', '02:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['02:00', '03:00', 'Journeys in Japan', 'Dokumenter', 'Wisata budaya Jepang.'],
    ['03:00', '06:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['06:00', '07:00', 'Japan Railway Journal', 'Dokumenter', 'Dunia kereta Jepang.'],
    ['07:00', '10:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['10:00', '11:00', 'Dining with the Chef', 'Kuliner', 'Masakan Jepang bersama koki.'],
    ['11:00', '14:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['14:00', '15:00', 'Core Kyoto', 'Dokumenter', 'Budaya Kyoto.'],
    ['15:00', '18:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['18:00', '19:00', 'Sumopedia', 'Olahraga', 'Mengenal dunia sumo.'],
    ['19:00', '22:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
    ['22:00', '23:00', 'Tokyo Eye 2020', 'Dokumenter', 'Sisi modern Tokyo.'],
    ['23:00', '24:00', 'NHK Newsline', 'Berita', 'Berita Jepang berbahasa Inggris.'],
  ],
};

const q = (v) => {
  v = String(v);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

const rows = [['Channel', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Judul Acara', 'Kategori', 'Deskripsi']];
DAYS.forEach((date, di) => {
  for (const [ch, slots] of Object.entries(T)) {
    for (const [s, e, t, c, d] of slots) {
      const title = t === 'PRIME' ? (PRIME[ch]?.[di] ?? t) : t;
      rows.push([ch, date, s, e, title, c, d]);
    }
  }
});

writeFileSync(new URL('./sheet-seed.csv', import.meta.url), '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\n'));
console.log(`OK: ${rows.length - 1} baris contoh → tools/sheet-seed.csv`);
