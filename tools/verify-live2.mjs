const base = 'https://haru-epg.pages.dev';
const j = await (await fetch(base + '/api/schedule?category=paytv&date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
console.log('source:', j.source);
for (const slug of ['animax', 'aniplus']) {
  const c = j.channels.find((x) => x.slug === slug);
  console.log(slug, '| now:', c.now ? `${c.now.startLabel} ${c.now.title.slice(0, 40)}` : 'null', '| next:', c.next ? `${c.next.startLabel} ${c.next.title.slice(0, 30)}` : 'null');
}
const home = await (await fetch(base + '/?date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const ai = home.indexOf('/channel/animax');
console.log('kartu Animax ada badge LIVE:', /LIVE/.test(home.slice(ai, ai + 1500)) ? 'OK' : 'FAIL');
console.log('kartu Animax SEDANG TAYANG:', home.slice(ai, ai + 1500).includes('SEDANG TAYANG') ? 'OK' : 'FAIL');
