Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public static class Badge {
  static int Dist(byte[] b, int i, Color c) {
    int dr = b[i+2]-c.R, dg = b[i+1]-c.G, db = b[i]-c.B;
    return (int)Math.Sqrt(dr*dr+dg*dg+db*db);
  }
  // Hapus background: flood fill dari tepi + sapu sisa warna mirip bg. Return bitmap 32bpp transparan.
  public static Bitmap Transparent(string path, int tol) {
    using (var src = new Bitmap(path)) {
      int W = src.Width, H = src.Height;
      var bmp = new Bitmap(W, H, PixelFormat.Format32bppArgb);
      using (var g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, W, H);
      var data = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      try {
        int stride = data.Stride;
        byte[] buf = new byte[stride * H];
        Marshal.Copy(data.Scan0, buf, 0, buf.Length);
        Color bg = Color.FromArgb(buf[2], buf[1], buf[0]);
        bool[] seen = new bool[W * H];
        var q = new Queue<int>();
        q.Enqueue(0); q.Enqueue(W-1); q.Enqueue((H-1)*W); q.Enqueue(H*W-1);
        int[] dx = {1,-1,0,0}, dy = {0,0,1,-1};
        while (q.Count > 0) {
          int p = q.Dequeue();
          if (seen[p]) continue; seen[p] = true;
          int x = p % W, y = p / W, i = y * stride + x * 4;
          if (Dist(buf, i, bg) > tol) continue;
          buf[i+3] = 0;
          for (int k = 0; k < 4; k++) {
            int nx = x + dx[k], ny = y + dy[k];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) q.Enqueue(ny * W + nx);
          }
        }
        int tight = tol / 2;
        for (int y = 0; y < H; y++)
          for (int x = 0; x < W; x++) {
            int i = y * stride + x * 4;
            if (buf[i+3] > 0 && Dist(buf, i, bg) <= tight) buf[i+3] = 0;
          }
        // Putihkan ikon (pertahankan alpha) agar kontras di atas badge terang
        for (int k = 0; k < buf.Length; k += 4) {
          if (buf[k+3] > 0) { buf[k] = 255; buf[k+1] = 255; buf[k+2] = 255; }
        }
        Marshal.Copy(buf, 0, data.Scan0, buf.Length);
      } finally { bmp.UnlockBits(data); }
      return bmp;
    }
  }
}
"@ -ReferencedAssemblies System.Drawing, System.Collections

$src = "D:\All Project\Proyek Web\haru-epg\public\logo.png"
$icon = [Badge]::Transparent($src, 60)
Write-Output "icon: $($icon.Width)x$($icon.Height)"

$size = 512
$out = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)

# badge gradasi rounded
$rad = 120
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $rad * 2, $rad * 2, 180, 90)
$path.AddArc($size - $rad * 2, 0, $rad * 2, $rad * 2, 270, 90)
$path.AddArc($size - $rad * 2, $size - $rad * 2, $rad * 2, $rad * 2, 0, 90)
$path.AddArc(0, $size - $rad * 2, $rad * 2, $rad * 2, 90, 90)
$path.CloseFigure()
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, $size, $size)),
  [System.Drawing.Color]::FromArgb(124, 58, 237),
  [System.Drawing.Color]::FromArgb(236, 72, 153), 45.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend
$blend.Positions = @(0.0, 0.6, 1.0)
$blend.Colors = @([System.Drawing.Color]::FromArgb(124, 58, 237), [System.Drawing.Color]::FromArgb(168, 85, 247), [System.Drawing.Color]::FromArgb(236, 72, 153))
$brush.InterpolationColors = $blend
$g.FillPath($brush, $path)

# ikon di tengah (padding ramping agar besar terbaca)
$pad = 40
$g.DrawImage($icon, $pad, $pad, $size - $pad * 2, $size - $pad * 2)

$out.Save($src, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $out.Dispose(); $icon.Dispose()
Write-Output "SAVED badge $src"
