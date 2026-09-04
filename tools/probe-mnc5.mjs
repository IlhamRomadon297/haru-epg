const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// 1) slug重要か? coba slug asal
for (const u of ['channel/detail/157/animax/1', 'channel/detail/157/xxx/1']) {
  const r = await fetch(B + u, { headers: { 'User-Agent': UA } });
  const t = await r.text();
  console.log(u, '->', r.status, 'len', t.length, 'sched?', t.includes('tm-channel-schedule'));
}
// 2) POST form jadwal: fchannel + fdate + search_model=channel
const body = new URLSearchParams({ search_model: 'channel', fchannel: '157', fdate: '2026-09-05' });
const p = await fetch(B + 'schedule/table', {
  method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
});
const pt = await p.text();
console.log('POST table ->', p.status, 'len', pt.length);
console.log('rows:', [...pt.matchAll(/tm-program-title/g)].length);
const times = [...pt.matchAll(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g)].slice(0, 5);
console.log('first times:', times.map((m) => m[1]).join(' | '));
