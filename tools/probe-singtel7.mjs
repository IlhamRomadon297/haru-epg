const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data';
const tries = ['', '?channelId=5045', '?epgChannelId=5045', '?channel=5045', '?date=2026-09-04', '?channelId=5045&date=2026-09-04'];
for (const q of tries) {
  try {
    const r = await fetch(B + q, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    const t = await r.text();
    console.log(q || '(bare)', '->', r.status, 'len', t.length, '|', t.slice(0, 220).replace(/\s+/g, ' '));
  } catch (e) {
    console.log(q || '(bare)', 'ERR', String(e).slice(0, 100));
  }
}
