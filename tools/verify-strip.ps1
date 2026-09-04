Add-Type -AssemblyName System.Drawing
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos'

foreach ($slug in @('antv','bbc-news','gtv','hbo','animax')) {
  $b = New-Object System.Drawing.Bitmap("$d\$slug.png")
  Write-Output "`n$slug $($b.Width)x$($b.Height)"
  # Check bottom 100px for blue
  $blueRows = 0
  for ($y = [Math]::Max(0, $b.Height - 100); $y -lt $b.Height; $y += 5) {
    $bluePx = 0; $totPx = 0
    for ($x = 0; $x -lt $b.Width; $x += 50) {
      $totPx++
      $c = $b.GetPixel($x, $y)
      if ($c.R -lt 50 -and $c.G -lt 100 -and $c.B -gt 140) { $bluePx++ }
    }
    if ($totPx -gt 0 -and ($bluePx / $totPx) -ge 0.5) { $blueRows++ }
  }
  # Check top area for content
  $contentRows = 0
  for ($y = 0; $y -lt [Math]::Min(200, $b.Height); $y += 5) {
    $hasContent = $false
    for ($x = 0; $x -lt $b.Width; $x += 50) {
      $c = $b.GetPixel($x, $y)
      if ($c.A -gt 10 -and ($c.R -lt 230 -or $c.G -lt 230 -or $c.B -lt 230)) { $hasContent = $true; break }
    }
    if ($hasContent) { $contentRows++ }
  }
  Write-Output "  Blue rows in bottom 100px: $blueRows"
  Write-Output "  Content rows in top 200px: $contentRows"
  $b.Dispose()
}
