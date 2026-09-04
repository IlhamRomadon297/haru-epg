const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) logo di halaman detail channel?
const det = await (await fetch(B + 'channel/detail/157/x/1', { headers: { 'User-Agent': UA } })).text();
for (const m of [...det.matchAll(/<img[^>]*>/gi)]) {
  const s = m[0];
  if (/logo|channel|ch-|157/i.test(s)) console.log('DETAIL IMG:', s.slice(0, 220));
}
// 2) bagaimana nama channel tertulis di /channel?
const ch = await (await fetch(B + 'channel', { headers: { 'User-Agent': UA } })).text();
for (const m of [...ch.matchAll(/.{60}[Aa]nimax.{60}/g)].slice(0, 4)) {
  console.log('CTX:', JSON.stringify(m[0]).slice(0, 220));
}
