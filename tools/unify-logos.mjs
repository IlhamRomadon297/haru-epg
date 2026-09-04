// Harmonisasi logo: semua channel → /logos/<slug>.png (satu baris per channel)
import { readFileSync, writeFileSync } from 'node:fs';
const f = new URL('../src/lib/channels.ts', import.meta.url);
const lines = readFileSync(f, 'utf8').split('\n');
let n = 0;
const out = lines.map((ln) => {
  const slug = ln.match(/slug:\s*'([^']+)'/)?.[1];
  if (slug && /logo:\s*(logo\('[^']*'\)|'[^']*'|"[^"]*")/.test(ln)) {
    n++;
    return ln.replace(/,\s*logo:\s*(logo\('[^']*'\)|'[^']*'|"[^"]*")/, `, logo: '/logos/${slug}.png'`);
  }
  return ln;
});
writeFileSync(f, out.join('\n'));
console.log(`OK: ${n} logo diseragamkan`);
