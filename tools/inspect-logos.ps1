Add-Type -AssemblyName System.Drawing
$dir = Join-Path $env:TEMP 'logo-sample'
foreach ($f in Get-ChildItem $dir -Filter *.png) {
  $b = New-Object System.Drawing.Bitmap($f.FullName)
  $c1 = $b.GetPixel(2, 2); $c2 = $b.GetPixel($b.Width - 3, $b.Height - 3)
  $cc = $b.GetPixel([int]($b.Width / 2), [int]($b.Height / 2))
  Write-Output ("{0}: {1}x{2} fmt={3} corner1=A{4}({5},{6},{7}) corner2=A{8}({9},{10},{11}) center=({12},{13},{14})" -f $f.Name, $b.Width, $b.Height, $b.PixelFormat, $c1.A, $c1.R, $c1.G, $c1.B, $c2.A, $c2.R, $c2.G, $c2.B, $cc.R, $cc.G, $cc.B)
  $b.Dispose()
}
