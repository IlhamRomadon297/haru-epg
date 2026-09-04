const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const html = await (await fetch('https://www.mncvision.id/schedule/table', { headers: { 'User-Agent': UA } })).text();
console.log('LEN', html.length);
const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
console.log('--- SCRIPTS ---'); scripts.forEach((s) => console.log(' ', s));
const urls = [...new Set([...html.matchAll(/["']((?:https?:[^"']*)?\/[a-z0-9_.\-/]*schedule[a-z0-9_.\-/]*)["']/gi)].map((m) => m[1]))];
console.log('--- SCHEDULE URLS ---'); urls.slice(0, 20).forEach((s) => console.log(' ', s));
// konteks kata "channel"
for (const m of [...html.matchAll(/.{80}channel.{120}/gi)].slice(0, 6)) {
  console.log('--- CTX ---', JSON.stringify(m[0]).slice(0, 260));
}
