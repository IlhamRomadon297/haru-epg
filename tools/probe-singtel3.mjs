const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaruEPG/1.0';
const page = await (await fetch('https://www.singtel.com/personal/products-services/tv/tv-programme-guide', { headers: { 'User-Agent': UA } })).text();
// semua JS yang dimuat halaman
const scripts = [...new Set([...page.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]))];
console.log('TOTAL SCRIPTS:', scripts.length);
scripts.forEach((s) => console.log(' ', s.slice(0, 160)));
