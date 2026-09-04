import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logosDir = resolve(__dirname, '../public/logos');
mkdirSync(logosDir, { recursive: true });

// Clear all existing logos first
const { readdirSync, unlinkSync } = await import('node:fs');
for (const f of readdirSync(logosDir)) {
  if (f.endsWith('.png') || f.endsWith('.svg')) {
    unlinkSync(`${logosDir}/${f}`);
  }
}
console.log('Cleared all logos');

const GH = 'https://raw.githubusercontent.com/Iqbalbala/CHANNEL/main/';
const POSTIMG = 'https://i.postimg.cc/';
const IBB = 'https://i.ibb.co.com/';

// All channels → source URL mapping
const MAP = {
  // From Iqbalbala/CHANNEL (have blue bars built-in)
  'animax':       GH + 'animax.png',
  'aniplus':      GH + 'aniplus.png',
  'rcti':         GH + 'rcti.png',
  'mnctv':        GH + 'mnctv.png',
  'gtv':          GH + 'gtv.png',
  'inews':        GH + 'inews.png',
  'sctv':         GH + 'sctv.png',
  'trans-tv':     GH + 'transtv.png',
  'trans7':       GH + 'trans7.png',
  'rtv':          GH + 'rtv.png',
  'antv':         GH + 'antv.png',
  'tvone':        GH + 'tvone.png',
  'tvri':         GH + 'tvri.png',
  'kompas-tv':    GH + 'kompastv.png',
  'metro-tv':     GH + 'metrotv.png',
  'axn':          GH + 'axn.png',
  'tvn':          GH + 'tvn.png',
  'tvn-movies':   GH + 'tvnmovies.png',
  'rock-action':  GH + 'rockact.png',
  'rock-entertainment': GH + 'rockent.png',
  'hits-movies':  GH + 'hitsmovies.png',
  'hbo':          GH + 'hbo.png',
  'hbo-hits':     GH + 'hbohits.png',
  'hbo-family':   GH + 'hbofam.png',
  'hbo-signature':GH + 'hbosignature.png',

  // From postimg (have blue bars built-in)
  'kix':          POSTIMG + 'rFNdNjDq/image.png',
  'studio-universal': POSTIMG + 'BQjGxBFh/29239-D8-E-320-A-4-B1-A-84-BF-8-D1-BF45077-EB.png',
  'moji':         POSTIMG + '0Q1LVkwK/image.png',
  'mdtv':         POSTIMG + 'zXTx8sV8/image.png',

  // From ibb.co
  'mentari-tv':   IBB + '09LFvJ3/image.png',
  'vtv':          IBB + 'ChwZjYw/image.png',
  'nhk-world':    'http://edge.linknetott.swiftserve.com/STBWEBVIEWADS/urlinfo/ui3/channel_logo_icon/241.png',
};

// Special channels: re-download from Wikimedia (already done previously)
const WIKIMEDIA = {
  'moji':         'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moji_blue.svg/500px-Moji_blue.svg.png',
  'sinpo-tv':     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Sin_Po_TV.svg/500px-Sin_Po_TV.svg.png',
  'cnn-indonesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/CNN_Indonesia_logo.svg/500px-CNN_Indonesia_logo.svg.png',
};

// Merge: Wikimedia overrides playlist for moji
const ALL = { ...MAP, ...WIKIMEDIA };

let ok = 0, fail = [];
for (const [slug, url] of Object.entries(ALL)) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    if (!r.ok || buf.length < 500 || !isPng) throw new Error(`bad (${r.status}, ${buf.length}b, png=${isPng})`);
    writeFileSync(`${logosDir}/${slug}.png`, buf);
    console.log('OK  ', slug, buf.length + 'b');
    ok++;
  } catch (e) {
    console.log('FAIL', slug, String(e.message ?? e).slice(0, 80));
    fail.push(slug);
  }
}

console.log(`\n${ok}/${Object.keys(ALL).length} OK`);
if (fail.length) console.log('Gagal:', fail.join(', '));
