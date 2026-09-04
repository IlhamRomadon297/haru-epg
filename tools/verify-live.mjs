const res = await fetch('https://haru-epg.pages.dev/channel/aniplus?date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } });
const s = await res.text();
const eps = s.match(/\(Ep \d+\)/g) || [];
console.log('Ep marks:', eps.length, '| contoh:', eps.slice(0, 3).join(', '));
console.log('singtel logo imgs:', (s.match(/singtel\.com\/content\/dam[^"']*/g) || []).length);
console.log('logo.svg:', s.includes('/logo.svg'), '| datenav:', s.includes('datenav'), '| footer D1:', s.includes('tiap 2 jam'));
