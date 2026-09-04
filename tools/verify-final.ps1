Add-Type -AssemblyName System.Drawing
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos'

foreach ($slug in @('antv','bbc-news','gtv','hbo','animax','indosiar','rcti','trans7','france24','cnn-indonesia')) {
  $b = New-Object System.Drawing.Bitmap("$d\$slug.png")
  # Check bottom 120px for blue
  $blueCount = 0; $total = 0
  for ($y = [Math]::Max(0, $b.Height - 120); $y -lt $b.Height; $y += 5) {
    for ($x = 0; $x -lt $b.Width; $x += 50) {
      $total++
      $c = $b.GetPixel($x, $y)
      if ($c.R -lt 60 -and $c.G -lt 120 -and $c.B -gt 130) { $blueCount++ }
    }
  }
  $pct = if ($total -gt 0) { [int]($blueCount / $total * 100) } else { 0 }
  Write-Output "$slug $($b.Width)x$($b.Height) blue-bottom=${pct}%"
  $b.Dispose()
}
