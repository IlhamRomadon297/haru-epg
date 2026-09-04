Add-Type -AssemblyName System.Drawing

$origDir = 'D:\All Project\Proyek Web\haru-epg\public\logos\originals'
$outDir  = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$n = 0

$files = Get-ChildItem $origDir -Filter *.png | Sort-Object Name
Write-Output "Processing $($files.Count) originals..."

foreach ($f in $files) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $raw = New-Object System.Drawing.Bitmap($f.FullName)

  # ===== STEP 1: Find content bounds =====
  $minY = $raw.Height; $maxY = 0
  for ($y = 0; $y -lt $raw.Height; $y++) {
    for ($x = 0; $x -lt $raw.Width; $x += 2) {
      $c = $raw.GetPixel($x, $y)
      if ($c.A -lt 5) { continue }
      if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) { continue }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  if ($minY -ge $raw.Height) { $raw.Dispose(); continue }

  # ===== STEP 2: Blue bar detection =====
  # Strategy: scan ALL rows in bottom 200px. For each row, compute blue%.
  # A "solid blue row" = blue% >= 70%.
  # Find the LAST (bottommost) solid blue row, then scan upward from there
  # to find the top of the contiguous block of solid blue rows.
  # At least 10 contiguous solid blue rows = valid bar.

  $rowBlue = @()  # array of booleans, one per row in bottom 200
  $scanStart = [Math]::Max(0, $raw.Height - 200)
  for ($y = $scanStart; $y -lt $raw.Height; $y++) {
    $bluePx = 0; $totPx = 0
    $step = [Math]::Max(1, [int]($raw.Width / 20))
    for ($x = 0; $x -lt $raw.Width; $x += $step) {
      $totPx++
      $c = $raw.GetPixel($x, $y)
      if ($c.R -lt 80 -and $c.G -lt 140 -and $c.B -gt 100) { $bluePx++ }
    }
    $ratio = if ($totPx -gt 0) { $bluePx / $totPx } else { 0 }
    $rowBlue += ($ratio -ge 0.70)
  }

  # Find bottommost solid blue row
  $barBottom = -1
  for ($i = $rowBlue.Count - 1; $i -ge 0; $i--) {
    if ($rowBlue[$i]) { $barBottom = $scanStart + $i; break }
  }

  # Find top of contiguous solid blue block from barBottom
  $barTop = -1
  if ($barBottom -ge 0) {
    $barTop = $barBottom
    for ($i = $barBottom - $scanStart - 1; $i -ge 0; $i--) {
      if ($rowBlue[$i]) { $barTop = $scanStart + $i }
      else { break }
    }
  }

  # Validate bar
  $validBar = $false
  if ($barTop -ge 0 -and $barBottom -ge 0) {
    $barH = $barBottom - $barTop + 1
    if ($barH -ge 10) { $validBar = $true }
  }

  # ===== STEP 3: Crop =====
  $pad = 10
  $cropTop = [Math]::Max(0, $minY - $pad)
  $cropBot = $raw.Height

  if ($validBar) {
    $cropBot = $barTop
    Write-Output "BAR  $slug (bar y=$barTop-$barBottom h=$($barBottom-$barTop+1), content y=$minY-$maxY)"
  } else {
    Write-Output "NOBAR $slug (content y=$minY-$maxY)"
  }

  $cropH = $cropBot - $cropTop
  if ($cropH -lt 20) { $cropH = [Math]::Max(20, $maxY - $cropTop + $pad) }

  # ===== STEP 4: Draw on 500x500 white canvas =====
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.CompositingQuality = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)

  $s = [Math]::Min(470 / [Math]::Max($raw.Width, 1), 470 / [Math]::Max($cropH, 1))
  $dw = [int]($raw.Width * $s)
  $dh = [int]($cropH * $s)
  $dx = [int]((500 - $dw) / 2)
  $dy = [int]((500 - $dh) / 2)

  $srcRect = New-Object System.Drawing.Rectangle(0, $cropTop, $raw.Width, $cropH)
  $dstRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
  $g.DrawImage($raw, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $raw.Dispose()

  $outFile = Join-Path $outDir "$slug.png"
  $out.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
}

Write-Output "`nTOTAL: $n processed from originals"
