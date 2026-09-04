Add-Type -AssemblyName System.Drawing
$dir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$bar = [System.Drawing.Color]::FromArgb(7, 43, 196)
# File yg SUDAH ber-bar bawaan playlist → jangan disentuh
$keepers = @('animax','aniplus','antv','axn','gtv','hbo','hbo-family','hbo-hits','hbo-signature',
  'hits-movies','inews','kompas-tv','metro-tv','mnctv','rcti','rock-action','rock-entertainment',
  'rtv','sctv','trans7','trans-tv','tvn','tvn-movies','tvone','tvri')
$labels = @{
  'abc-australia' = 'ABC AUSTRALIA'; 'al-jazeera' = 'AL JAZEERA'; 'arirang' = 'ARIRANG'
  'bbc-news' = 'BBC NEWS'; 'bein-sports-1' = 'BEIN SPORTS 1'; 'bein-sports-2' = 'BEIN SPORTS 2'
  'bein-sports-3' = 'BEIN SPORTS 3'; 'bloomberg' = 'BLOOMBERG'; 'btv' = 'BTV'
  'celestial-movies' = 'CELESTIAL MOVIES'; 'cgtn' = 'CGTN'; 'cna' = 'CNA'; 'cnbc' = 'CNBC'
  'cnn-indonesia' = 'CNN INDONESIA'; 'dw' = 'DW'; 'euronews' = 'EURONEWS'
  'france24' = 'FRANCE 24'; 'garuda-tv' = 'GARUDA TV'; 'indosiar' = 'INDOSIAR'
  'kix' = 'KIX'; 'mdtv' = 'MDTV'; 'mentari-tv' = 'MENTARI TV'; 'moji' = 'MOJI'
  'nhk-world' = 'NHK WORLD'; 'nusantara-tv' = 'NUSANTARA TV'; 'sindonews-tv' = 'SINDONEWS TV'
  'sinpo-tv' = 'SIN PO TV'; 'spotv' = 'SPOTV'; 'spotv-2' = 'SPOTV 2'
  'studio-universal' = 'STUDIO UNIVERSAL'; 'vtv' = 'VTV'
}
$n = 0; $k = 0
foreach ($f in Get-ChildItem $dir -Filter *.png | Sort-Object Name) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  if ($keepers -contains $slug) { $k++; continue }
  if (-not $labels.ContainsKey($slug)) { Write-Output "SKIP (no label) $slug"; continue }
  $raw = New-Object System.Drawing.Bitmap($f.FullName)
  # 1) normalisasi ke kanvas putih 500x500 (contain) — apapun ukuran/format sumber
  $norm = New-Object System.Drawing.Bitmap(500, 500)
  $gn = [System.Drawing.Graphics]::FromImage($norm)
  $gn.InterpolationMode = 'HighQualityBicubic'
  $gn.Clear([System.Drawing.Color]::White)
  $sn = [Math]::Min(500 / $raw.Width, 500 / $raw.Height)
  $nw, $nh = [int]($raw.Width * $sn), [int]($raw.Height * $sn)
  $gn.DrawImage($raw, [int]((500 - $nw) / 2), [int]((500 - $nh) / 2), $nw, $nh)
  $gn.Dispose(); $raw.Dispose()
  # 2) deteksi bar bawaan pada citra yg sudah dinormalisasi
  $hits = 0; $tot = 0
  foreach ($px in @(30, 100, 400, 470)) {
    foreach ($py in @(420, 460, 485)) {
      $tot++
      $c = $norm.GetPixel($px, $py)
      if ($c.B -gt 100 -and $c.R -lt 110 -and $c.B -gt $c.R + 40) { $hits++ }
    }
  }
  if (($hits / $tot) -ge 0.5) {
    $norm.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
    $norm.Dispose()
    Write-Output "KEEP (bar bawaan) $slug"; $k++
    continue
  }
  # 3) komposit: art di area atas + bar biru + label putih
  $src = $norm
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.SmoothingMode = 'AntiAlias'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::White)
  $s = [Math]::Min(450 / $src.Width, 330 / $src.Height)
  $dw, $dh = [int]($src.Width * $s), [int]($src.Height * $s)
  $g.DrawImage($src, [int]((500 - $dw) / 2), [int](15 + (345 - $dh) / 2), $dw, $dh)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($bar)), 0, 390, 500, 110)
  $txt = $labels[$slug]
  $fam = New-Object System.Drawing.FontFamily('Segoe UI')
  $size = [int][Math]::Min(56, 440 / ($txt.Length * 0.85))
  $font = New-Object System.Drawing.Font($fam, $size, [System.Drawing.FontStyle]::Bold)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $fmt.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
  $g.DrawString($txt, $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 390, 500, 110)), $fmt)
  $font.Dispose(); $g.Dispose(); $src.Dispose()
  $out.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
  Write-Output "BAR $slug ($txt, $size)"
}
Write-Output "TOTAL: $n"
