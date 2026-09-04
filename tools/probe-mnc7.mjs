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
console.log('POST ->', p.status, 'len', pt.length, 'rows:', [...pt.matchAll(/tm-program-title/g)].length);
const times = [...pt.matchAll(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/g)].map((m) => `${m[1]}-${m[2]}`);
console.log('FIRST:', times.slice(0, 3).join(' | '));
console.log('LAST:', times.slice(-3).join(' | '));
console.log('HAS 2026-09-05:', pt.includes('20260905'));
