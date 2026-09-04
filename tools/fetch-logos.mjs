// Unduh logo playlist → public/logos/<slug>.png (vendor lokal, tidak hotlink)
import { mkdirSync, writeFileSync } from 'node:fs';

const GH = 'https://raw.githubusercontent.com/Iqbalbala/CHANNEL/main/';
const MAP = {
  animax: GH + 'animax.png',
  aniplus: GH + 'aniplus.png',
  hbo: GH + 'hbo.png',
  'hbo-hits': GH + 'hbohits.png',
  'hbo-family': GH + 'hbofam.png',
  'hbo-signature': GH + 'hbosig.png',
  rcti: GH + 'rcti.png',
  mnctv: GH + 'mnctv.png',
  gtv: GH + 'gtv.png',
  inews: GH + 'inews.png',
  sctv: GH + 'sctv.png',
  trans7: GH + 'trans7.png',
  transtv: GH + 'transtv.png',
  rtv: GH + 'rtv.png',
  antv: GH + 'antv.png',
  tvone: GH + 'tvone.png',
  tvri: GH + 'tvri.png',
  kompastv: GH + 'kompastv.png',
  metrotv: GH + 'metrotv.png',
  axn: GH + 'axn.png',
  tvn: GH + 'tvn.png',
  'rock-entertainment': GH + 'rockent.png',
  'rock-action': GH + 'rockact.png',
  'tvn-movies': GH + 'tvnmovies.png',
  'hits-movies': GH + 'hitsmovies.png',
  kix: 'https://i.postimg.cc/rFNdNjDq/image.png',
  'studio-universal': 'https://i.postimg.cc/BQjGxBFh/29239-D8-E-320-A-4-B1-A-84-BF-8-D1-BF45077-EB.png',
  moji: 'https://i.postimg.cc/0Q1LVkwK/image.png',
  mdtv: 'https://i.postimg.cc/zXTx8sV8/image.png',
  'mentari-tv': 'https://i.ibb.co.com/09LFvJ3/image.png',
  vtv: 'https://i.ibb.co.com/ChwZjYw/image.png',
  'nhk-world': 'http://edge.linknetott.swiftserve.com/STBWEBVIEWADS/urlinfo/ui3/channel_logo_icon/241.png',
};

mkdirSync(new URL('../public/logos/', import.meta.url), { recursive: true });
let ok = 0, fail = [];
for (const [slug, url] of Object.entries(MAP)) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    if (!r.ok || buf.length < 2000 || !isPng) throw new Error(`bad (${r.status}, ${buf.length}b, png=${isPng})`);
    writeFileSync(new URL(`../public/logos/${slug}.png`, import.meta.url), buf);
    console.log('OK  ', slug, buf.length + 'b');
    ok++;
  } catch (e) {
    console.log('FAIL', slug, String(e.message ?? e).slice(0, 80));
    fail.push(slug);
  }
}
console.log(`\n${ok}/${Object.keys(MAP).length} berhasil`);
if (fail.length) console.log('Gagal:', fail.join(', '));
