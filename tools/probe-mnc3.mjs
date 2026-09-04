const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) form di schedule/table
const html = await (await fetch(B + 'schedule/table', { headers: { 'User-Agent': UA } })).text();
for (const m of [...html.matchAll(/<form[\s\S]{0,400}/gi)].slice(0, 3)) {
  console.log('--- FORM ---', JSON.stringify(m[0]).slice(0, 500));
}
for (const m of [...html.matchAll(/<select[^>]*name=["']([^"']+)["'][\s\S]{0,600}/gi)].slice(0, 4)) {
  console.log('--- SELECT', m[1], '---', JSON.stringify(m[0]).slice(0, 500));
}
// 2) coba POST formSearch (GET dulu lihat respons)
const get = await (await fetch(B + 'schedule/formSearch', { headers: { 'User-Agent': UA } })).text();
console.log('FORMSEARCH GET LEN', get.length, '->', get.slice(0, 300));
// 3) channel detail — ada jadwalnya?
const det = await (await fetch(B + 'channel/detail/1/vision-prime-hd/1', { headers: { 'User-Agent': UA } })).text();
console.log('DETAIL LEN', det.length);
console.log('TIME PATTERNS:', [...det.matchAll(/([0-2]\d:[0-5]\d)/g)].length);
const sched = [...new Set([...det.matchAll(/["']([^"']*sched[^"']*)["']/gi)].map((m) => m[1]))];
console.log('--- SCHED REFS ---'); sched.slice(0, 15).forEach((s) => console.log(' ', s.slice(0, 160)));
