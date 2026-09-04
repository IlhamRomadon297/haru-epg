const base = 'https://haru-epg.pages.dev';
const s = await (await fetch(base + '/?kategori=paytv&date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const links = [...s.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
console.log('STYLESHEETS:', links.length);
links.forEach((l) => console.log(' ', l.slice(0, 200)));
const href = links[0]?.match(/href="([^"]+)"/)?.[1];
if (href) {
  const css = await (await fetch(base + href)).text();
  console.log('CSS LEN', css.length);
  for (const pat of ['.foot-card', 'footer.site', '.foot-brand', '.foot-tag', '.foot-meta']) {
    const i = css.indexOf(pat);
    console.log(`--- ${pat}:`, i >= 0 ? css.slice(i, i + 260).replace(/\s+/g, ' ') : 'NOT FOUND');
  }
}
