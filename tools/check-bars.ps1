Add-Type -AssemblyName System.Drawing
$dir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
# warna bar: sample beberapa titik area bawah logo playlist yg jelas ber-bar
$animax = New-Object System.Drawing.Bitmap("$dir\animax.png")
foreach ($p in @((100, 455), (250, 455), (400, 455), (250, 480))) {
  $c = $animax.GetPixel($p[0], $p[1])
  Write-Output ("bar sample ({0},{1}): ({2},{3},{4})" -f $p[0], $p[1], $c.R, $c.G, $c.B)
}
$animax.Dispose()
# deteksi: file yg TIDAK punya bar biru (pixel bawah-tengah bukan biru)
Write-Output '--- tanpa bar biru: ---'
foreach ($f in Get-ChildItem $dir -Filter *.png) {
  $b = New-Object System.Drawing.Bitmap($f.FullName)
  if ($b.Width -ne 500) { Write-Output ("{0}: UKURAN {1}x{2}" -f $f.Name, $b.Width, $b.Height) }
  $c = $b.GetPixel(250, 460)
  $isBlue = ($c.B -gt 100 -and $c.R -lt 110 -and $c.B -gt $c.R + 40)
  if (-not $isBlue) { Write-Output ("{0}: bottom=({1},{2},{3})" -f $f.Name, $c.R, $c.G, $c.B) }
  $b.Dispose()
}
