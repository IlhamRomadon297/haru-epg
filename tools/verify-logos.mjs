const base = 'https://haru-epg.pages.dev';
const j = await (await fetch(base + '/api/schedule?date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
const slugs = [...new Set(j.channels.map((c) => c.slug))];
console.log('channels:', slugs.length);
let bad = [];
await Promise.all(slugs.map(async (s) => {
  try {
    const r = await fetch(`${base}/logos/${s}.png`, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const b = Buffer.from(await r.arrayBuffer());
    if (!r.ok || b.length < 2000) bad.push(`${s} (${r.status}, ${b.length}b)`);
  } catch (e) { bad.push(`${s} ERR`); }
}));
console.log(bad.length ? 'RUSAK/HILANG:\n ' + bad.join('\n ') : 'SEMUA 56 LOGO OK');
