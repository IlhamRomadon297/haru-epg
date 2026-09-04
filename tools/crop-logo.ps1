Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class LogoCrop {
  public static int[] BBox(string path, double maxYFrac, int tol) {
    using (var bmp = new Bitmap(path)) {
      int W = bmp.Width, H = bmp.Height;
      Color bg = bmp.GetPixel(5, 5);
      int maxY = (int)(H * maxYFrac);
      int sx0 = (int)(W * 0.25), sx1 = (int)(W * 0.75);
      int minX = W, minY = H, maxX = -1, maxY2 = -1;
      var data = bmp.LockBits(new Rectangle(0, 0, W, maxY), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
      try {
        int stride = data.Stride;
        byte[] buf = new byte[stride * maxY];
        Marshal.Copy(data.Scan0, buf, 0, buf.Length);
        for (int y = 0; y < maxY; y++)
          for (int x = sx0; x < sx1; x++) {
            int i = y * stride + x * 3;
            if (Math.Abs(buf[i]-bg.B) > tol || Math.Abs(buf[i+1]-bg.G) > tol || Math.Abs(buf[i+2]-bg.R) > tol) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY2) maxY2 = y;
            }
          }
      } finally { bmp.UnlockBits(data); }
      return new int[]{minX, minY, maxX, maxY2, W, H};
    }
  }
}
"@ -ReferencedAssemblies System.Drawing

$src = "C:\Users\Ilham R\Downloads\Gemini_Generated_Image_issg4pissg4pissg.jpg"
$dst = "D:\All Project\Proyek Web\haru-epg\public\logo.png"
$box = [LogoCrop]::BBox($src, 0.52, 24)
$minX, $minY, $maxX, $maxY2, $imgW, $imgH = $box
Write-Output "DBG minX=$minX minY=$minY maxX=$maxX maxY2=$maxY2 W=$imgW H=$imgH"
Write-Output "BBOX x=$minX y=$minY X=$maxX Y=$maxY2 img=${imgW}x${imgH}"
$pad = 48
$x = [Math]::Max(0, $minX - $pad); $y = [Math]::Max(0, $minY - $pad)
Write-Output "T1 x=$x y=$y"
$x2 = [Math]::Min($imgW, $maxX + $pad); $y2 = [Math]::Min($imgH, $maxY2 + $pad)
Write-Output "T2 x2=$x2 y2=$y2"
$w = $x2 - $x; $h = $y2 - $y
Write-Output "T3 w=$w h=$h"
$side = [Math]::Max($w, $h)
Write-Output "T4 side=$side"
$cx = $x + $w / 2; $cy = $y + $h / 2
Write-Output "T5 cx=$cx cy=$cy"
$nx = [int]($cx - $side / 2); $ny = [int]($cy - $side / 2)
Write-Output "T6 nx=$nx ny=$ny"
$tmpA = $imgW - $side
$tmpB = $imgH - $side
Write-Output "T6b tmpA=$tmpA tmpB=$tmpB"
$nx = [Math]::Max(0, [Math]::Min($tmpA, $nx))
$ny = [Math]::Max(0, [Math]::Min($tmpB, $ny))
Write-Output "T7 nx=$nx ny=$ny"
$side = [Math]::Min($side, [Math]::Min($imgW - $nx, $imgH - $ny))
Write-Output "CROP x=$nx y=$ny side=$side"
$bmp = New-Object System.Drawing.Bitmap($src)
$crop = $bmp.Clone([System.Drawing.Rectangle]::FromLTRB($nx, $ny, $nx + $side, $ny + $side), $bmp.PixelFormat)
$crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose(); $bmp.Dispose()
Write-Output "SAVED $dst"
