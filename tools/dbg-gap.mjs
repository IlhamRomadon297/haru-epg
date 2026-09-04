const j = await (await fetch('https://haru-epg.pages.dev/api/channel/aniplus?date=2026-09-04', { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
const ps = j.channel.programs;
console.log('total:', ps.length);
ps.filter((p) => p.start >= '2026-09-04T12:30' && p.start < '2026-09-04T14:30')
  .forEach((p) => console.log(p.start.slice(11, 16), '-', p.end.slice(11, 16), '|', p.title.slice(0, 55)));
