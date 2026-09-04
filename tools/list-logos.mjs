import { readFileSync } from 'node:fs';
const m3u = readFileSync(String.raw`D:\Playlist Pribadi.m3u`, 'utf8');
const logos = [...new Set([...m3u.matchAll(/tvg-logo="([^"]+)"/g)].map((m) => m[1]))];
console.log('UNIQUE LOGOS:', logos.length);
logos.forEach((u) => console.log(' ', u));
