const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
// 1) struktur 1 item Singtel (full, tanpa truncate)
const sg = await (await fetch('https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/04092026.json', { headers: { 'User-Agent': UA } })).json();
const it = sg['5340'][0];
console.log('KEYS:', Object.keys(it).join(','));
console.log('PROGRAM KEYS:', Object.keys(it.program ?? {}).join(','));
console.log(JSON.stringify({ start: it.startDateTime, dur: it.duration, title: it.program?.title, sub: it.program?.subCategory, desc: (it.program?.description ?? '').slice(0, 80) }, null, 1));
// 2) MNC tanggal lampau?
const body = new URLSearchParams({ search_model: 'channel', af0rmelement: 'aformelement', fchannel: '157', fdate: '2026-09-01', submit: 'Cari' });
const mnc = await (await fetch('https://www.mncvision.id/schedule/table', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body })).text();
console.log('MNC PAST rows:', [...mnc.matchAll(/tm-program-title|Program Acara/g)].length, 'has20260901:', mnc.includes('20260901'));
// 3) tivie tanggal lampau?
const tv = await (await fetch('https://tivie.id/channel/rcti/20260901', { headers: { 'User-Agent': UA } })).text();
console.log('TIVIE PAST len:', tv.length, 'events:', [...tv.matchAll(/"@type":\s*"BroadcastEvent"/g)].length);
