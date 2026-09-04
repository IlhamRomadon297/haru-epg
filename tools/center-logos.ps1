Add-Type -AssemblyName System.Drawing

$rawDir = 'D:\All Project\Proyek Web\haru-epg\public\logos\raw'
$outDir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$n = 0

$files = Get-ChildItem $rawDir -File | Sort-Object Name
Write-Output "Processing $($files.Count) raw logos..."

foreach ($f in $files) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $raw = New-Object System.Drawing.Bitmap($f.FullName)

  # Step 1: Find content bounds
  $minX = $raw.Width; $maxX = 0; $minY = $raw.Height; $maxY = 0
  for ($y = 0; $y -lt $raw.Height; $y++) {
    for ($x = 0; $x -lt $raw.Width; $x++) {
      $c = $raw.GetPixel($x, $y)
      if ($c.A -lt 10) { continue }
      if ($c.R -gt 245 -and $c.G -gt 245 -and $c.B -gt 245) { continue }
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }

  if ($minY -ge $raw.Height) {
    Write-Output "SKIP $slug (empty/white)"
    $raw.Dispose()
    continue
  }

  $pad = 15
  $cropX = [Math]::Max(0, $minX - $pad)
  $cropY = [Math]::Max(0, $minY - $pad)
  $cropW = [Math]::Min($raw.Width - $cropX, $maxX - $minX + $pad * 2 + 1)
  $cropH = [Math]::Min($raw.Height - $cropY, $maxY - $minY + $pad * 2 + 1)

  # Step 2: Draw on 500x500 white canvas
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.CompositingQuality = 'HighQuality'
  $g.SmoothingMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)

  $s = [Math]::Min(460 / [Math]::Max($cropW, 1), 460 / [Math]::Max($cropH, 1))
  $dw = [int]($cropW * $s)
  $dh = [int]($cropH * $s)
  $dx = [int]((500 - $dw) / 2)
  $dy = [int]((500 - $dh) / 2)

  $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
  $dstRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
  $g.DrawImage($raw, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $raw.Dispose()

  $outFile = Join-Path $outDir "$slug.png"
  $out.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
  Write-Output "OK   $slug (${dw}x${dh} at ${dx},${dy})"
}

Write-Output "`nTOTAL: $n logos processed"
