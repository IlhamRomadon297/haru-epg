const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
const m = page.match(/<ux-tv-channel-epg datamodel="([\s\S]{0,4000}?)"><\/ux-tv-channel-epg>/);
let dm = (m?.[1] ?? '').replace(/&#34;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
console.log('DATAMODEL:', dm.slice(0, 2500));
try {
  const obj = JSON.parse(dm);
  console.log('KEYS:', Object.keys(obj).join(','));
  const ep = obj.epgEndPoint ?? obj.epgEndpoint ?? obj.endpoint;
  console.log('ENDPOINT:', ep);
  if (ep) {
    const url = 'https://www.singtel.com' + ep;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const t = await r.text();
    console.log('EP FETCH:', r.status, 'len', t.length);
    console.log(t.slice(0, 600));
  }
} catch (e) {
  console.log('PARSE FAIL', String(e).slice(0, 200));
}
