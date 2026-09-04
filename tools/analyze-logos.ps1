Add-Type -AssemblyName System.Drawing
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos'

foreach ($slug in @('antv','bbc-news','cnn-indonesia','gtv','hbo')) {
  $b = New-Object System.Drawing.Bitmap("$d\$slug.png")
  Write-Output "`n$slug $($b.Width)x$($b.Height)"
  # Scan bottom portion for blue bar
  for ($y = [Math]::Max(0, $b.Height - 150); $y -lt $b.Height; $y += 10) {
    $blueCount = 0; $whiteCount = 0; $otherCount = 0
    foreach ($x in @(10, 50, 100, 200, 300, 400, 490)) {
      if ($x -ge $b.Width) { continue }
      $c = $b.GetPixel($x, [Math]::Min($y, $b.Height - 1))
      # Blue bar: R<50, G<80, B>150
      if ($c.R -lt 50 -and $c.G -lt 80 -and $c.B -gt 150) { $blueCount++ }
      # White
      elseif ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) { $whiteCount++ }
      else { $otherCount++ }
    }
    Write-Output "  y=$y blue=$blueCount white=$whiteCount other=$otherCount"
  }
  $b.Dispose()
}
