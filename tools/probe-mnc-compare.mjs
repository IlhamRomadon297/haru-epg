const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const B = 'https://www.mncvision.id/';
// Bandingkan tivie vs MNC untuk SCTV, RCTI, ANTV hari ini
for (const [name, id] of [['SCTV', '89'], ['RCTI', '80'], ['ANTV', '115']]) {
  const body = new URLSearchParams({ search_model: 'channel', af0rmelement: 'aformelement', fchannel: id, fdate: '2026-09-04', submit: 'Cari' });
  const pt = await (await fetch(B + 'schedule/table', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body })).text();
  const times = [...pt.matchAll(/<td class="text-center">(\d{2}:\d{2})<\/td>\s*<td><a[^>]*>([^<]+)<\/a>/g)].map((m) => `${m[1]} ${m[2].slice(0, 40)}`);
  console.log(`=== MNC ${name} (${id}): ${times.length} acara ===`);
  times.filter((t) => t >= '11:00').forEach((t) => console.log(' ', t));
}
// Verifikasi nama channel 84 (Sindo News TV?)
const det = await (await fetch(B + 'channel/detail/84/x/1', { headers: { 'User-Agent': UA } })).text();
const h = det.match(/<h2[^>]*>([\s\S]{0,300}?)<\/h2>/);
console.log('CH84 head:', JSON.stringify(h?.[1] ?? 'NONE').slice(0, 200));
