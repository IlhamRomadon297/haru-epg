const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) daftar lengkap channel (value -> nama)
const html = await (await fetch(B + 'schedule/table', { headers: { 'User-Agent': UA } })).text();
const sel = html.match(/<select[^>]*name="fchannel"[\s\S]*?<\/select>/);
const opts = [...(sel?.[0] ?? '').matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)].map((m) => `${m[1]} = ${m[2]}`);
console.log('TOTAL CHANNELS:', opts.length);
opts.forEach((o) => console.log(' ', o));
// 2) struktur blok jadwal di halaman detail
const det = await (await fetch(B + 'channel/detail/157/animax/1', { headers: { 'User-Agent': UA } })).text();
console.log('ANIMAX DETAIL LEN', det.length, 'STATUS ok');
const idx = det.indexOf('tm-channel-schedule');
console.log('--- SCHEDULE BLOCK ---');
console.log(det.slice(Math.max(0, idx - 500), idx + 2500));
