const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
const ch = await (await fetch(B + 'channel', { headers: { 'User-Agent': UA } })).text();
const pairs = [...ch.matchAll(/<img src="(userfiles\/image\/channel\/[^"]+)" alt="([^"]+)"/gi)].map((m) => ({ alt: m[2], src: B + m[1] }));
console.log('TOTAL LOGOS:', pairs.length);
const want = ['beIN Sports 1', 'beIN Sports 2', 'beIN Sports 3', 'SPOTV', 'SPOTV 2', 'AXN', 'tvN', 'ONE', 'KIX', 'HITS Movies', 'HITS', 'Celestial Movies', 'Studio Universal', 'tvN Movies', 'Rock Action', 'Rock Entertainment', 'Al Jazeera', 'BBC World News', 'NHK World', 'Channel News Asia', 'ABC Australia', 'Arirang', 'DW English', 'France 24', 'Euronews', 'Bloomberg', 'CNBC', 'CGTN', 'Animax'];
for (const w of want) {
  const hit = pairs.filter((p) => p.alt.toLowerCase() === w.toLowerCase());
  console.log(w, '->', hit.length ? hit.map((h) => h.src).join(' | ') : 'NOT FOUND');
}
console.log('--- SAMPLE ALTS ---');
pairs.slice(0, 10).forEach((p) => console.log(' ', JSON.stringify(p.alt), '->', p.src));
