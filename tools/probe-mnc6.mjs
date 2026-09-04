const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) full-day atau partial? hitung baris + jam pertama/terakhir
const det = await (await fetch(B + 'channel/detail/157/x/1', { headers: { 'User-Agent': UA } })).text();
const times = [...det.matchAll(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/g)].map((m) => `${m[1]}-${m[2]}`);
console.log('ROWS:', times.length);
console.log('FIRST:', times.slice(0, 3).join(' | '));
console.log('LAST:', times.slice(-3).join(' | '));
// 2) form lengkap: semua input/select + format tanggal
const html = await (await fetch(B + 'schedule/table', { headers: { 'User-Agent': UA } })).text();
for (const m of [...html.matchAll(/<input[^>]*>/gi)]) console.log('IN:', m[0].slice(0, 160));
const fdate = html.match(/name="fdate"[\s\S]{0,300}/);
console.log('FDATE CTX:', JSON.stringify(fdate?.[0] ?? 'NOT FOUND').slice(0, 400));
