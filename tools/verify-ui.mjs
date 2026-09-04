const base = 'https://haru-epg.pages.dev';
const get = async (p) => (await fetch(base + p, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const home = await get('/?kategori=paytv&date=2026-09-04');
// urutan: animax & aniplus harus muncul sebelum hbo
const ia = home.indexOf('/channel/animax'), ib = home.indexOf('/channel/aniplus'), ih = home.indexOf('/channel/hbo?');
console.log('featured order (animax, aniplus < hbo):', ia, ib, ih, ia >= 0 && ib >= 0 && ia < ih && ib < ih ? 'OK' : 'FAIL');
console.log('label Pay TV:', home.includes('Pay TV ·') ? 'OK' : 'FAIL');
for (const w of ['Kemarin', 'Hari Ini', 'Besok', 'Lusa']) console.log(`strip "${w}":`, home.includes(w) ? 'OK' : 'FAIL');
console.log('footer card:', home.includes('foot-card') && home.includes('© 2026 Haru EPG') ? 'OK' : 'FAIL');
const logo = await (await fetch(base + '/logo.svg')).text();
console.log('logo tv (= murni, tanpa antena/huruf):', !logo.includes('<line ') && !logo.includes('>H<') && logo.includes('<rect') ? 'OK' : 'FAIL');
