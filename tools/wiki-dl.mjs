const FILES = {
  'garuda-tv': 'File:Garuda Vision TV 2023.png',
  'nusantara-tv': 'File:Nusantara TV logo.png',
};
import { writeFileSync } from 'node:fs';
for (const [slug, title] of Object.entries(FILES)) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&titles=' + encodeURIComponent(title);
  const r = await (await fetch(u, { headers: { 'User-Agent': 'HaruEPG/1.0' } })).json();
  const pages = r.query?.pages ?? {};
  const info = Object.values(pages)[0]?.imageinfo?.[0];
  console.log(slug, '->', info?.width + 'x' + info?.height, info?.url?.slice(0, 120));
  const clean = (info?.url ?? '').split('?')[0];
  if (info?.url && (clean.endsWith('.png') || clean.endsWith('.jpg'))) {
    const img = await fetch(info.url, { headers: { 'User-Agent': 'HaruEPG/1.0' } });
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length > 3000) {
      writeFileSync(new URL(`../public/logos/${slug}.png`, import.meta.url), buf);
      console.log('  SAVED', buf.length + 'b');
      continue;
    }
  }
  console.log('  SKIP');
}
