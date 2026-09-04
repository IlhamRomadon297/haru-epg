Add-Type -AssemblyName System.Drawing
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$n = 0

foreach ($f in (Get-ChildItem $d -Filter *.png | Sort-Object Name)) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $raw = New-Object System.Drawing.Bitmap($f.FullName)
  
  # Step 1: Find content bounds (non-white, non-transparent pixels)
  # Scan every pixel, generous threshold
  $minY = $raw.Height; $maxY = 0
  for ($y = 0; $y -lt $raw.Height; $y++) {
    $hasContent = $false
    for ($x = 0; $x -lt $raw.Width; $x += 2) {
      $c = $raw.GetPixel($x, $y)
      # Skip fully transparent
      if ($c.A -lt 5) { continue }
      # Skip near-white (background)
      if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) { continue }
      $hasContent = $true; break
    }
    if ($hasContent) {
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  
  if ($minY -ge $raw.Height) {
    $raw.Dispose()
    Write-Output "SKIP $slug (all white)"
    continue
  }
  
  # Step 2: Detect blue bar — scan whole image bottom-up to find continuous blue band
  # The bar is a horizontal band of blue (R<60, G<120, B>130) spanning most of the width
  $barStart = -1; $barEnd = -1
  $inBlueBand = $false
  for ($y = $raw.Height - 1; $y -ge 0; $y--) {
    $bluePx = 0; $totPx = 0
    $step = [Math]::Max(1, [int]($raw.Width / 30))
    for ($x = 0; $x -lt $raw.Width; $x += $step) {
      $totPx++
      $c = $raw.GetPixel($x, $y)
      if ($c.R -lt 60 -and $c.G -lt 120 -and $c.B -gt 130) { $bluePx++ }
    }
    $isBlueRow = ($totPx -gt 0 -and ($bluePx / $totPx) -ge 0.45)
    
    if ($isBlueRow) {
      if (-not $inBlueBand) {
        $barEnd = $y  # bottom of blue band
        $inBlueBand = $true
      }
      $barStart = $y  # keeps updating to top of blue band
    } elseif ($inBlueBand) {
      break  # Found top of blue band
    }
  }
  
  # Step 3: Determine crop region
  if ($barStart -ge 0 -and $barEnd -ge 0 -and $barStart -gt $minY) {
    # Bar found — crop just above the bar (include generous padding)
    $cropTop = [Math]::Max(0, $minY - 15)
    $cropBot = $barStart
    Write-Output "BAR  $slug (bar y=$barStart-$barEnd, content y=$minY-$maxY, crop=$cropTop-$cropBot)"
  } else {
    # No bar — keep all content with padding
    $cropTop = [Math]::Max(0, $minY - 15)
    $cropBot = [Math]::Min($raw.Height, $maxY + 15)
    Write-Output "NOBAR $slug (content y=$minY-$maxY, crop=$cropTop-$cropBot)"
  }
  
  $cropH = $cropBot - $cropTop
  if ($cropH -lt 10) { $cropH = $maxY - $cropTop + 10 }
  
  # Step 4: Draw onto 500x500 white canvas, preserving aspect ratio
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.CompositingQuality = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)
  
  # Fit inside 470x470 (15px margin each side)
  $s = [Math]::Min(470 / [Math]::Max($raw.Width, 1), 470 / [Math]::Max($cropH, 1))
  $dw = [int]($raw.Width * $s)
  $dh = [int]($cropH * $s)
  $dx = [int]((500 - $dw) / 2)
  $dy = [int]((500 - $dh) / 2)
  
  $srcRect = New-Object System.Drawing.Rectangle(0, $cropTop, $raw.Width, $cropH)
  $dstRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
  $g.DrawImage($raw, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $raw.Dispose()
  
  $out.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
}

Write-Output "`nTOTAL: $n logos processed"
