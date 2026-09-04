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
for (const m of [...pt.matchAll(/.{200}20260905.{200}/g)].slice(0, 4)) {
  console.log('---', JSON.stringify(m[0]).slice(0, 480));
}
