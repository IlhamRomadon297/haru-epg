// Unduh logo asli MNC Vision → public/logos/<slug>.png (timpa hasil generate)
const B = 'https://www.mncvision.id/userfiles/image/channel/';
const MAP = {
  btv: 'channel_103.png', mdtv: 'channel_116.png', indosiar: 'channel_78.png',
  'sindonews-tv': 'channel_84.png', 'bein-sports-1': 'channel_309.png',
  'bein-sports-2': 'channel_310.png', 'bein-sports-3': 'channel_311.png',
  spotv: 'channel_307.png', 'spotv-2': 'channel_308.png', kix: 'channel_161.png',
  'celestial-movies': 'celestial.png', 'studio-universal': 'channel_26.png',
  bloomberg: 'bloomberg.png', 'al-jazeera': 'channel_331.png', 'bbc-news': 'channel_332.png',
  cna: 'channel_330.png', 'abc-australia': 'channel_350.png', arirang: 'channel_351.png',
  dw: 'channel_357.png', france24: 'channel_352.png', euronews: 'channel_333.png',
  cnbc: 'channel_337.png', cgtn: 'channel_353.png',
};
import { writeFileSync } from 'node:fs';
let ok = 0; const fail = [];
for (const [slug, file] of Object.entries(MAP)) {
  try {
    const r = await fetch(B + file, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    if (!r.ok || buf.length < 2000 || buf[0] !== 0x89) throw new Error(`bad ${r.status} ${buf.length}b`);
    writeFileSync(new URL(`../public/logos/${slug}.png`, import.meta.url), buf);
    console.log('OK  ', slug, buf.length + 'b');
    ok++;
  } catch (e) { console.log('FAIL', slug, String(e.message ?? e).slice(0, 60)); fail.push(slug); }
}
console.log(`${ok}/${Object.keys(MAP).length} OK` + (fail.length ? ' | gagal: ' + fail.join(',') : ''));
