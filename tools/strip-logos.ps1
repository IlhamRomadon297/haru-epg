Add-Type -AssemblyName System.Drawing
$dir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$n = 0
foreach ($f in Get-ChildItem $dir -Filter *.png) {
  $raw = New-Object System.Drawing.Bitmap($f.FullName)
  # 1) Normalisasi ke kanvas putih 500x500 (contain)
  $norm = New-Object System.Drawing.Bitmap(500, 500)
  $gn = [System.Drawing.Graphics]::FromImage($norm)
  $gn.InterpolationMode = 'HighQualityBicubic'
  $gn.Clear([System.Drawing.Color]::White)
  $sn = [Math]::Min(500 / $raw.Width, 500 / $raw.Height)
  $nw, $nh = [int]($raw.Width * $sn), [int]($raw.Height * $sn)
  $gn.DrawImage($raw, [int]((500 - $nw) / 2), [int]((500 - $nh) / 2), $nw, $nh)
  $gn.Dispose(); $raw.Dispose()
  # 2) Deteksi bar biru: scan dari bawah ke atas, cari baris dominan biru
  $barTop = -1
  for ($y = 499; $y -ge 100; $y--) {
    $bluePx = 0; $totPx = 0
    foreach ($x in @(20, 100, 250, 400, 480)) {
      $totPx++
      $c = $norm.GetPixel($x, $y)
      if ($c.B -gt 100 -and $c.R -lt 120 -and $c.B -gt $c.R + 30) { $bluePx++ }
    }
    if (($bluePx / $totPx) -lt 0.4) {
      $barTop = $y + 1
      break
    }
  }
  if ($barTop -lt 0) { $barTop = 390 }  # fallback
  # 3) Crop: ambil area di atas bar biru (atau seluruh gambar jika tidak ada bar)
  $cropH = [Math]::Min($barTop, 500)
  $crop = New-Object System.Drawing.Bitmap(500, $cropH)
  $gc = [System.Drawing.Graphics]::FromImage($crop)
  $gc.InterpolationMode = 'HighQualityBicubic'
  $gc.Clear([System.Drawing.Color]::White)
  $gc.DrawImage($norm, 0, 0, 500, $cropH)
  $gc.Dispose()
  $norm.Dispose()
  # 4) Scale crop ke 500x500 canvas (contain, center)
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $go = [System.Drawing.Graphics]::FromImage($out)
  $go.InterpolationMode = 'HighQualityBicubic'
  $go.Clear([System.Drawing.Color]::White)
  $so = [Math]::Min(480 / $crop.Width, 480 / $crop.Height)
  $dw, $dh = [int]($crop.Width * $so), [int]($crop.Height * $so)
  $go.DrawImage($crop, [int]((500 - $dw) / 2), [int]((500 - $dh) / 2), $dw, $dh)
  $go.Dispose(); $crop.Dispose()
  $out.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
  Write-Output "STRIP $($f.Name) (bar at y=$barTop)"
}
Write-Output "TOTAL: $n logos stripped"
