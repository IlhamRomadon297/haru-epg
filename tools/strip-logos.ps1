Add-Type -AssemblyName System.Drawing
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos'
$n = 0

foreach ($f in (Get-ChildItem $d -Filter *.png | Sort-Object Name)) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $raw = New-Object System.Drawing.Bitmap($f.FullName)
  
  # Step 1: Find content bounds (non-white pixels)
  $minY = $raw.Height; $maxY = 0
  for ($y = 0; $y -lt $raw.Height; $y++) {
    $hasContent = $false
    for ($x = 0; $x -lt $raw.Width; $x += 3) {
      $c = $raw.GetPixel($x, $y)
      if ($c.A -gt 10 -and ($c.R -lt 230 -or $c.G -lt 230 -or $c.B -lt 230)) {
        $hasContent = $true; break
      }
    }
    if ($hasContent) {
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  
  if ($minY -ge $raw.Height) {
    # All white — skip
    $raw.Dispose()
    Write-Output "SKIP $slug (all white)"
    continue
  }
  
  # Step 2: Detect blue bar in the region below content (maxY+1 to bottom)
  $barStart = -1; $barEnd = -1
  $contentBottom = $maxY + 1
  for ($y = $contentBottom; $y -lt $raw.Height; $y++) {
    $bluePx = 0; $totPx = 0
    for ($x = 0; $x -lt $raw.Width; $x += [Math]::Max(1, [int]($raw.Width / 20))) {
      $totPx++
      $c = $raw.GetPixel($x, $y)
      # Blue bar: deep blue (R<50, G<100, B>140)
      if ($c.R -lt 50 -and $c.G -lt 100 -and $c.B -gt 140) { $bluePx++ }
    }
    if ($totPx -gt 0 -and ($bluePx / $totPx) -ge 0.5) {
      if ($barStart -lt 0) { $barStart = $y }
      $barEnd = $y
    }
  }
  
  # Also check for blue bar WITHIN the content area (bar overlaps logo)
  # Scan from bottom of content upward
  if ($barStart -lt 0) {
    for ($y = $maxY; $y -ge [Math]::Max(0, $maxY - 150); $y--) {
      $bluePx = 0; $totPx = 0
      for ($x = 0; $x -lt $raw.Width; $x += [Math]::Max(1, [int]($raw.Width / 20))) {
        $totPx++
        $c = $raw.GetPixel($x, $y)
        if ($c.R -lt 50 -and $c.G -lt 100 -and $c.B -gt 140) { $bluePx++ }
      }
      if ($totPx -gt 0 -and ($bluePx / $totPx) -ge 0.6) {
        if ($barEnd -lt 0) { $barEnd = $y }
        $barStart = $y
      } elseif ($barEnd -ge 0) {
        break  # Found bottom of bar, now found top
      }
    }
  }
  
  # Step 3: Determine crop region
  $cropTop = [Math]::Max(0, $minY - 5)  # Small padding above
  $cropBot = $maxY + 1  # Default: include all content
  
  if ($barStart -ge 0 -and $barEnd -ge 0) {
    # Bar found — crop just above the bar
    $cropBot = [Math]::Max($barStart - 1, $cropTop)
    Write-Output "BAR  $slug (bar y=$barStart-$barEnd, content y=$minY-$maxY, crop=$cropTop-$cropBot)"
  } else {
    Write-Output "NOBAR $slug (content y=$minY-$maxY)"
  }
  
  # Step 4: Crop and scale to 500x500 on white canvas
  $cropH = $cropBot - $cropTop
  if ($cropH -lt 10) { $cropH = $maxY - $cropTop + 1 }  # Fallback
  
  $out = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.CompositingQuality = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)
  
  # Scale to fit 460x460 (leaving 20px padding each side)
  $s = [Math]::Min(460 / [Math]::Max($raw.Width, 1), 460 / [Math]::Max($cropH, 1))
  $dw = [int]($raw.Width * $s)
  $dh = [int]($cropH * $s)
  $dx = [int]((500 - $dw) / 2)
  $dy = [int]((500 - $dh) / 2)
  
  # DrawImage with source crop rect
  $srcRect = New-Object System.Drawing.Rectangle(0, $cropTop, $raw.Width, $cropH)
  $dstRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
  $g.DrawImage($raw, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $raw.Dispose()
  
  $out.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $n++
}

Write-Output "`nTOTAL: $n logos processed"
