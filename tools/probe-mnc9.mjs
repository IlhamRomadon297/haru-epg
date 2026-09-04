const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
const body = new URLSearchParams({
  search_model: 'channel', af0rmelement: 'aformelement',
  fchannel: '157', fdate: '2026-09-05', submit: 'Cari',
});
const p = await fetch(B + 'schedule/table', {
  method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
});
const pt = await p.text();
console.log('LEN', pt.length, 'HASDATE', pt.includes('20260905') || pt.includes('2026-09-05'));
console.log('TABLE COUNT', [...pt.matchAll(/<table/gi)].length);
const i = pt.indexOf('20260905');
console.log('CTX:', i >= 0 ? JSON.stringify(pt.slice(Math.max(0, i - 300), i + 300)).slice(0, 700) : 'NONE');
