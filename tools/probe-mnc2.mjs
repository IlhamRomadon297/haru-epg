const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) myajax.js — cari pemakaian formSearch
const js = await (await fetch(B + 'assets/js/myajax.js?20240418', { headers: { 'User-Agent': UA } })).text();
console.log('MYAJAX LEN', js.length);
for (const m of [...js.matchAll(/.{100}[Ff]ormSearch.{200}/g)].slice(0, 5)) {
  console.log('---', JSON.stringify(m[0]).slice(0, 340));
}
// 2) apakah HTML tabel sudah berisi data jadwal (cari pola jam)
const html = await (await fetch(B + 'schedule/table', { headers: { 'User-Agent': UA } })).text();
const times = [...html.matchAll(/([0-2]\d:[0-5]\d)/g)].length;
console.log('TIME PATTERNS IN HTML:', times);
const rows = [...html.matchAll(/<tr[\s>][\s\S]{0,300}/g)].length;
console.log('TR COUNT:', rows);
// 3) halaman /channel — daftar channel + id
const ch = await (await fetch(B + 'channel', { headers: { 'User-Agent': UA } })).text();
console.log('CHANNEL LEN', ch.length);
const links = [...new Set([...ch.matchAll(/href=["']([^"']*channel[^"']*)["']/gi)].map((m) => m[1]))];
console.log('--- CHANNEL LINKS ---'); links.slice(0, 20).forEach((s) => console.log(' ', s.slice(0, 160)));
