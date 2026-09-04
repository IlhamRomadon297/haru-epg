import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const local = readFileSync('public/logo.png');
console.log('local:', local.length, 'sha:', createHash('sha256').update(local).digest('hex').slice(0, 16));
const r = await fetch('https://haru-epg.pages.dev/logo.png', { headers: { 'User-Agent': 'Mozilla/5.0' } });
const buf = Buffer.from(await r.arrayBuffer());
console.log('live:', r.status, buf.length, 'sha:', createHash('sha256').update(buf).digest('hex').slice(0, 16));
console.log(buf.length === local.length ? 'IDENTIK' : 'BEDA');
