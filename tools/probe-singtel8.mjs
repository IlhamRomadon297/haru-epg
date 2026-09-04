const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data';
const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;

// 1) cakupan tanggal: -7 .. +14
const now = new Date();
for (let off = -7; off <= 14; off++) {
  const d = new Date(now);
  d.setDate(d.getDate() + off);
  const f = fmt(d);
  try {
    const r = await fetch(`${B}/${f}.json`, { headers: { 'User-Agent': UA } });
    console.log(`${off >= 0 ? '+' : ''}${off} ${f} ->`, r.status);
  } catch (e) {
    console.log(`${off} ${f} ERR`, String(e).slice(0, 60));
  }
}
// 2) isi file hari ini
const today = fmt(now);
const data = await (await fetch(`${B}/${today}.json`, { headers: { 'User-Agent': UA } })).json();
const keys = Object.keys(data);
console.log('TOTAL CHANNEL KEYS:', keys.length);
// cari HBO / ANIPLUS / ANIMAX: butuh peta nama — ambil dari halaman guide
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
const m = page.match(/<ux-tv-channel-epg datamodel="([\s\S]*?)"><\/ux-tv-channel-epg>/);
const dm = JSON.parse((m?.[1] ?? '').replace(/&#34;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
const wanted = dm.tvChannelLists.filter((c) => /hbo|aniplus|animax/i.test(c.title));
console.log('--- WANTED CHANNELS ---');
for (const c of wanted) {
  const items = data[c.epgChannelId] ?? [];
  console.log(`${c.title} | epgChannelId=${c.epgChannelId} | items=${items.length}`);
  if (items[0]) console.log('   sample:', JSON.stringify(items[0]).slice(0, 300));
}
