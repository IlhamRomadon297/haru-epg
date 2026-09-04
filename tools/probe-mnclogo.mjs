const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
// logo channel di halaman /channel MNC Vision
const html = await (await fetch('https://www.mncvision.id/channel', { headers: { 'User-Agent': UA } })).text();
console.log('LEN', html.length);
// cari blok logo: img dengan alt/nama channel kita
const imgs = [...html.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
console.log('TOTAL IMG:', imgs.length);
imgs.slice(0, 3).forEach((s) => console.log('SAMPLE:', s.slice(0, 220)));
// kaitkan: cari konteks sekitar nama channel target
for (const name of ['Animax', 'SPOTV', 'beIN Sports 1', 'AXN', 'Al Jazeera']) {
  const i = html.indexOf(`>${name}<`);
  if (i < 0) { console.log(name, '-> NOT FOUND as >name<'); continue; }
  const ctx = html.slice(Math.max(0, i - 600), i + 100);
  const src = ctx.match(/<img[^>]+src="([^"]+)"/);
  console.log(name, '-> IMG:', src?.[1]?.slice(0, 160) ?? 'NONE');
}
