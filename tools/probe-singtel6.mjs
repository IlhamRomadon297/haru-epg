const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
const m = page.match(/<ux-tv-channel-epg datamodel="([\s\S]*?)"><\/ux-tv-channel-epg>/);
console.log('MATCH:', !!m, 'LEN:', m?.[1]?.length ?? 0);
let dm = (m?.[1] ?? '').replace(/&#34;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
console.log('DATAMODEL:', dm.slice(0, 3000));
