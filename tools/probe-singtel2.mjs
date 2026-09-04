const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const js = await (
  await fetch('https://cdn.aws.singtel.com/lux/main.4d7ccab3.js', { headers: { 'User-Agent': UA } })
).text();
console.log('BUNDLE LEN', js.length);
const urls = [...new Set([...js.matchAll(/https?:\/\/[a-z0-9\-._~:/?#@!$&'()*+,;=%]+/gi)].map((m) => m[0]))];
console.log('--- URLS (epg|api|guide|channel|tv) ---');
urls
  .filter((u) => /epg|api|guide|channel|singtel.*tv|tv.*prog/i.test(u))
  .slice(0, 30)
  .forEach((u) => console.log(' ', u.slice(0, 220)));
console.log('--- ux-tv-channel-epg context ---');
for (const m of [...js.matchAll(/.{120}ux-tv-channel-epg.{120}/g)].slice(0, 3)) {
  console.log(JSON.stringify(m[0]).slice(0, 380));
}
