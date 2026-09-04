Add-Type -AssemblyName System.Drawing
$dir = 'D:\All Project\Proyek Web\haru-epg\public\logos'
function New-Canvas {
  $b = New-Object System.Drawing.Bitmap(500, 500)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::White)
  return $b, $g
}
function Fit-Font($g, $fam, $text, $budget, $max) {
  $size = [int][Math]::Min($max, $budget / ($text.Length * 0.78))
  return (New-Object System.Drawing.Font($fam, $size, [System.Drawing.FontStyle]::Bold)), $size
}
$fam = New-Object System.Drawing.FontFamily('Segoe UI')
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'

# 1) moji — lowercase gradasi biru→ungu
$b, $g = New-Canvas
$font, $sz = Fit-Font $g $fam 'moji' 440 200
$br = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, 500, 500)),
  [System.Drawing.Color]::FromArgb(37, 99, 235), [System.Drawing.Color]::FromArgb(147, 51, 234), 0.0)
$r = New-Object System.Drawing.RectangleF(0, 0, 500, 500)
$g.DrawString('moji', $font, $br, $r, $fmt)
$font.Dispose(); $br.Dispose(); $g.Dispose()
$b.Save("$dir\moji.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
Write-Output "OK moji ($sz)"

# 2) cnn-indonesia — kotak merah CNN putih + INDONESIA navy
$b, $g = New-Canvas
$f1 = New-Object System.Drawing.Font($fam, 150, [System.Drawing.FontStyle]::Bold)
$box = New-Object System.Drawing.Rectangle(70, 130, 360, 170)
$rp = New-Object System.Drawing.Drawing2D.GraphicsPath
$rr = 28
$rp.AddArc($box.X, $box.Y, $rr * 2, $rr * 2, 180, 90)
$rp.AddArc($box.Right - $rr * 2, $box.Y, $rr * 2, $rr * 2, 270, 90)
$rp.AddArc($box.Right - $rr * 2, $box.Bottom - $rr * 2, $rr * 2, $rr * 2, 0, 90)
$rp.AddArc($box.X, $box.Bottom - $rr * 2, $rr * 2, $rr * 2, 90, 90)
$rp.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(204, 0, 0))), $rp)
$rf = New-Object System.Drawing.RectangleF(70, 130, 360, 170)
$g.DrawString('CNN', $f1, [System.Drawing.Brushes]::White, $rf, $fmt)
$f2, $sz2 = Fit-Font $g $fam 'INDONESIA' 400 90
$r2 = New-Object System.Drawing.RectangleF(0, 310, 500, 100)
$g.DrawString('INDONESIA', $f2, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 27, 46))), $r2, $fmt)
$f1.Dispose(); $f2.Dispose(); $g.Dispose()
$b.Save("$dir\cnn-indonesia.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
Write-Output "OK cnn-indonesia ($sz2)"

# 3) sinpo-tv — merah Sin Po
$b, $g = New-Canvas
$f3, $sz3 = Fit-Font $g $fam 'SIN PO TV' 440 130
$r3 = New-Object System.Drawing.RectangleF(0, 0, 500, 500)
$g.DrawString('SIN PO TV', $f3, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(185, 28, 28))), $r3, $fmt)
$f3.Dispose(); $g.Dispose()
$b.Save("$dir\sinpo-tv.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
Write-Output "OK sinpo-tv ($sz3)"
