const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
// 1) data kita (D1 via API)
const j = await (await fetch('https://haru-epg.pages.dev/api/channel/sctv?date=2026-09-04', { headers: { 'User-Agent': UA } })).json();
console.log('--- DATA KITA ---');
j.channel.programs
  .filter((p) => p.start >= '2026-09-04T11:00' && p.start < '2026-09-04T16:00')
  .forEach((p) => console.log(p.start.slice(11, 16), '-', p.end.slice(11, 16), '|', p.title.slice(0, 50)));
// 2) sumber live tivie.id saat ini
const html = await (await fetch('https://tivie.id/channel/sctv', { headers: { 'User-Agent': UA } })).text();
console.log('--- SUMBER LIVE ---');
const re = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
let m, n = 0;
while ((m = re.exec(html)) !== null && n < 40) {
  try {
    const arr = [JSON.parse(m[1])].flat();
    for (const it of arr) {
      if (it?.['@type'] === 'BroadcastEvent' && it.startDate >= '2026-09-04T11:00' && it.startDate < '2026-09-04T16:00') {
        console.log(it.startDate.slice(11, 16), '-', (it.endDate ?? '').slice(11, 16), '|', (it.name ?? '').slice(0, 50));
        n++;
      }
    }
  } catch {}
}
