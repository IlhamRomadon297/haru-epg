const Q = {
  'cnn-indonesia': 'CNN Indonesia logo',
  'garuda-tv': 'Garuda TV logo Indonesia',
  'nusantara-tv': 'Nusantara TV logo Indonesia',
  'sinpo-tv': 'Sin Po TV logo',
  moji: 'Moji TV Indonesia logo',
};
for (const [slug, q] of Object.entries(Q)) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch='
    + encodeURIComponent(q) + '&srnamespace=6&srlimit=8';
  const r = await (await fetch(u, { headers: { 'User-Agent': 'HaruEPG/1.0' } })).json();
  console.log(`=== ${slug}: ${q} ===`);
  for (const it of r.query?.search ?? []) console.log('  ', it.title);
}
