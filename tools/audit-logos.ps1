Add-Type -AssemblyName System.Drawing
$dir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
foreach ($f in Get-ChildItem $dir -Filter *.png | Sort-Object Name) {
  try {
    $b = New-Object System.Drawing.Bitmap($f.FullName)
    $blue = 0; $tot = 0
    for ($y = [int]($b.Height * 0.75); $y -lt $b.Height; $y += 4) {
      for ($x = 0; $x -lt $b.Width; $x += 8) {
        $tot++
        $c = $b.GetPixel($x, $y)
        if ($c.B -gt 100 -and $c.R -lt 110 -and $c.B -gt $c.R + 40) { $blue++ }
      }
    }
    $pct = [int]($blue / $tot * 100)
    Write-Output ("{0}: {1}x{2} blueBottom={3}%" -f $f.Name, $b.Width, $b.Height, $pct)
    $b.Dispose()
  } catch { Write-Output ("{0}: RUSAK {1}" -f $f.Name, $_.Exception.Message) }
}
