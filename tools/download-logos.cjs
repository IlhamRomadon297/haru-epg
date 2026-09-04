const fs = require('fs');
const path = require('path');

const RAW = 'D:/All Project/Proyek Web/haru-epg/public/logos/raw';
const MNC = 'https://www.mncvision.id/userfiles/image/channel/';
const GH = 'https://raw.githubusercontent.com/Iqbalbala/CHANNEL/main/';
const WIKI = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

// slug -> [urls to try]
const S = {
  'antv':               [MNC+'channel_115.png'],
  'btv':                [MNC+'channel_103.png'],
  'gtv':                [MNC+'channel_81.png'],
  'indosiar':           [MNC+'Indosiar.png'],
  'inews':              [MNC+'channel_83.png'],
  'kompas-tv':          [MNC+'channel_106.png'],
  'mdtv':               [MNC+'channel_116.png'],
  'metro-tv':           [MNC+'channel_107.png'],
  'mnctv':              [MNC+'channel_82.png'],
  'rcti':               [MNC+'channel_80.png'],
  'sctv':               [MNC+'sctv.png'],
  'trans-tv':           [MNC+'channel_87.png'],
  'trans7':             [MNC+'channel_110.png'],
  'tvone':              [MNC+'tvone.png'],
  'tvri':               [MNC+'channel_118.jpg'],
  'sindonews-tv':       [MNC+'channel_84.png'],
  'bein-sports-1':      [MNC+'channel_309.png'],
  'bein-sports-2':      [MNC+'channel_310.png'],
  'bein-sports-3':      [MNC+'channel_311.png'],
  'spotv':              [MNC+'channel_307.png'],
  'spotv-2':            [MNC+'channel_308.png'],
  'axn':                [MNC+'axn_150x150.jpg'],
  'tvn':                [MNC+'channel_158.png'],
  'kix':                [MNC+'channel_161.png'],
  'hits-movies':        [MNC+'channel_169.png'],
  'celestial-movies':   [MNC+'celestial.png'],
  'studio-universal':   [MNC+'channel_26.png'],
  'tvn-movies':         [MNC+'channel_25.png'],
  'rock-action':        [MNC+'channel_248.png'],
  'rock-entertainment': [MNC+'channel_240.png'],
  'al-jazeera':         [MNC+'channel_331.png'],
  'bbc-news':           [MNC+'channel_332.png'],
  'nhk-world':          [MNC+'channel_355.jpeg'],
  'cna':                [MNC+'channel_330.png'],
  'abc-australia':      [MNC+'channel_350.png'],
  'arirang':            [MNC+'channel_351.png'],
  'dw':                 [MNC+'channel_357.png'],
  'france24':           [MNC+'france_150px.jpg'],
  'euronews':           [MNC+'channel_333.png'],
  'bloomberg':          [MNC+'bloomberg.png'],
  'cnbc':               [MNC+'channel_337.png'],
  'cgtn':               [MNC+'channel_353.png'],
  'animax':             [MNC+'Animax_150x150.png', GH+'animax.png'],
  'aniplus':            [GH+'aniplus.png'],
  'cnn-indonesia':      [WIKI+'9/91/CNN_Indonesia_logo.svg/500px-CNN_Indonesia_logo.svg.png', GH+'cnnindonesia.png'],
  'garuda-tv':          ['https://i.ibb.co.com/gTsLtYk/image.png'],
  'mentari-tv':         ['https://i.ibb.co.com/09LFvJ3/image.png'],
  'moji':               [WIKI+'c/c9/Moji_blue.svg/500px-Moji_blue.svg.png'],
  'nusantara-tv':       ['https://i.ibb.co.com/gTsLtYk/image.png'],
  'sinpo-tv':           [WIKI+'e/e8/Sin_Po_TV.svg/500px-Sin_Po_TV.svg.png'],
  'vtv':                ['https://i.ibb.co.com/ChwZjYw/image.png'],
  'hbo':                [GH+'hbo.png'],
  'hbo-signature':      [GH+'hbo.png'],
  'hbo-family':         [GH+'hbofam.png'],
  'hbo-hits':           [GH+'hbohits.png'],
};

async function dl(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 12000);
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: c.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return null;
    if (buf[0] !== 0x89 && buf[0] !== 0xFF) return null;
    return buf;
  } catch { return null; }
}

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  let ok = 0, fail = [];

  for (const [slug, urls] of Object.entries(S)) {
    let buf = null, usedUrl = '';
    for (const u of urls) {
      buf = await dl(u);
      if (buf) { usedUrl = u; break; }
    }
    if (buf) {
      const ext = buf[0] === 0xFF ? '.jpg' : '.png';
      fs.writeFileSync(path.join(RAW, slug + ext), buf);
      ok++;
      console.log(`OK  ${slug} (${(buf.length/1024).toFixed(1)}KB) <- ${path.basename(usedUrl)}`);
    } else {
      fail.push(slug);
      console.log(`FAIL ${slug}`);
    }
  }

  console.log(`\nDone: ${ok}/${Object.keys(S).length}`);
  if (fail.length) console.log('Failed:', fail.join(', '));
})();
