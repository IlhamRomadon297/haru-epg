Add-Type -AssemblyName System.Drawing
$outDir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$maps = @{
  'bein-sports-1' = @('beIN', 'SPORTS 1')
  'bein-sports-2' = @('beIN', 'SPORTS 2')
  'bein-sports-3' = @('beIN', 'SPORTS 3')
  'spotv' = @('SPOTV')
  'spotv-2' = @('SPOTV 2')
  'celestial-movies' = @('CELESTIAL', 'MOVIES')
  'bbc-news' = @('BBC NEWS')
  'al-jazeera' = @('AL JAZEERA')
  'cna' = @('CNA')
  'abc-australia' = @('ABC', 'AUSTRALIA')
  'arirang' = @('ARIRANG')
  'dw' = @('DW')
  'france24' = @('FRANCE 24')
  'euronews' = @('euronews')
  'bloomberg' = @('Bloomberg')
  'cnbc' = @('CNBC')
  'cgtn' = @('CGTN')
  'cnn-indonesia' = @('CNN', 'INDONESIA')
  'garuda-tv' = @('GARUDA TV')
  'nusantara-tv' = @('NUSANTARA TV')
  'sinpo-tv' = @('SIN PO TV')
  'sindonews-tv' = @('SINDONEWS')
  'btv' = @('BTV')
  'indosiar' = @('INDOSIAR')
  'kix' = @('KIX')
  'studio-universal' = @('STUDIO', 'UNIVERSAL')
  'moji' = @('moji')
  'mdtv' = @('MDTV')
}
$navy = [System.Drawing.Color]::FromArgb(30, 27, 46)
foreach ($e in $maps.GetEnumerator()) {
  $slug, $lines = $e.Key, $e.Value
  $bmp = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::White)
  # teks: ukuran dari panjang karakter (kapital tebal ±0.80em per huruf, budget 400px)
  $fam = New-Object System.Drawing.FontFamily('Segoe UI')
  $maxLen = ($lines | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
  $size = [int][Math]::Min(120, 400 / ($maxLen * 0.80))
  if ($lines.Count -gt 1) { $size = [int][Math]::Min(96, $size) }
  $font = New-Object System.Drawing.Font($fam, $size, [System.Drawing.FontStyle]::Bold)
  $brush = New-Object System.Drawing.SolidBrush($navy)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $lh = $size * 1.12
  $totalH = $lh * $lines.Count + 34
  $y = (500 - $totalH) / 2
  foreach ($ln in $lines) {
    $g.DrawString($ln, $font, $brush, (New-Object System.Drawing.RectangleF(0, $y, 500, $lh)), $fmt)
    $y += $lh
  }
  # aksen gradasi di bawah teks
  $bar = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(190, 0, 120, 14)),
    [System.Drawing.Color]::FromArgb(124, 58, 237), [System.Drawing.Color]::FromArgb(236, 72, 153), 0.0)
  $by = $y + 10
  $g.FillRectangle($bar, 190, $by, 120, 14)
  $font.Dispose(); $brush.Dispose(); $bar.Dispose(); $g.Dispose()
  $bmp.Save("$outDir\$slug.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "OK $slug (size $size)"
}
