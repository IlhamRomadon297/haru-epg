const html = await (await fetch('https://www.mncvision.id/channel', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
for (const m of [...html.matchAll(/<img src="(userfiles\/image\/channel\/[^"]+)" alt="([^"]+)"/gi)]) {
  if (/indosiar|france|sindo/i.test(m[2])) console.log(m[2], '->', m[1]);
}
