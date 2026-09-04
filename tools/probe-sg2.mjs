const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
// 1) field episode di item Singtel?
const sg = await (await fetch('https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/04092026.json', { headers: { 'User-Agent': UA } })).json();
const items = sg['5340'];
console.log('TOTAL ANIPLUS:', items.length);
for (const it of items.slice(0, 3)) {
  console.log('---');
  console.log(' start:', it.startDateTime, '| dur:', it.duration);
  console.log(' title:', it.program?.title);
  console.log(' names:', JSON.stringify(it.program?.names)?.slice(0, 300));
  console.log(' programValues:', JSON.stringify(it.program?.programValues)?.slice(0, 300));
  console.log(' category:', it.program?.category, '| sub:', it.program?.subCategory);
  console.log(' flags:', JSON.stringify(it.program?.programflags)?.slice(0, 200));
}
// 2) logo Singtel untuk channel kita (path image di datamodel)
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
const m = page.match(/<ux-tv-channel-epg datamodel="([\s\S]*?)"><\/ux-tv-channel-epg>/);
const dm = JSON.parse((m?.[1] ?? '').replace(/&#34;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
for (const c of dm.tvChannelLists.filter((c) => ['5340', '5342', '6420', '6421', '6422', '6423'].includes(c.epgChannelId))) {
  console.log('LOGO SG:', c.epgChannelId, c.title.trim(), '->', c.image);
}
// 3) verifikasi konversi: item pertama ANIPLUS SGT vs yang tampil di API kita (WIB = SGT-1)
console.log('RAW SGT pertama:', items[0].startDateTime, '=> WIB harus:', items[0].startDateTime.slice(0, 11) + String(Number(items[0].startDateTime.slice(11, 13)) - 1).padStart(2, '0') + items[0].startDateTime.slice(13));
