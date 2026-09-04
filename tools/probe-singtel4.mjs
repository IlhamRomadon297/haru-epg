const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
// konteks komponen epg + URL json/config di HTML
for (const pat of ['channel-epg', '.json', 'data-url', 'data-api', 'epgApi', 'tvGuide']) {
  const hits = [...page.matchAll(new RegExp(`.{150}${pat}.{150}`, 'gi'))].slice(0, 4);
  console.log(`=== ${pat} (${hits.length}) ===`);
  hits.forEach((m) => console.log(JSON.stringify(m[0]).slice(0, 400)));
}
