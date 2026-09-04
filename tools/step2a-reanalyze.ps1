Add-Type -AssemblyName System.Drawing

# Analyze ALL logos: find where the blue bar starts from bottom
$d = 'D:\All Project\Proyek Web\haru-epg\public\logos\originals'
$origDir = 'D:\All Project\Proyek Web\haru-epg\public\logos\originals'

# First, re-download originals for the problematic ones
# These are the ones that still have blue bars

$GH = 'https://raw.githubusercontent.com/Iqbalbala/CHANNEL/main/'
$reDL = @{
  'animax' = $GH + 'animax.png'
  'aniplus' = $GH + 'aniplus.png'
  'antv' = $GH + 'antv.png'
  'axn' = $GH + 'axn.png'
  'gtv' = $GH + 'gtv.png'
  'hbo' = $GH + 'hbo.png'
  'hbo-family' = $GH + 'hbofam.png'
  'hbo-hits' = $GH + 'hbohits.png'
  'hbo-signature' = $GH + 'hbosignature.png'
  'hits-movies' = $GH + 'hitsmovies.png'
  'indosiar' = $GH + 'indosiar.png'
  'inews' = $GH + 'inews.png'
  'kompas-tv' = $GH + 'kompastv.png'
  'metro-tv' = $GH + 'metrotv.png'
  'mnctv' = $GH + 'mnctv.png'
  'rcti' = $GH + 'rcti.png'
  'rock-action' = $GH + 'rockact.png'
  'rock-entertainment' = $GH + 'rockent.png'
  'rtv' = $GH + 'rtv.png'
  'sctv' = $GH + 'sctv.png'
  'trans-tv' = $GH + 'transtv.png'
  'trans7' = $GH + 'trans7.png'
  'tvn' = $GH + 'tvn.png'
  'tvn-movies' = $GH + 'tvnmovies.png'
  'tvone' = $GH + 'tvone.png'
  'tvri' = $GH + 'tvri.png'
  'vtv' = 'https://i.ibb.co.com/ChwZjYw/image.png'
  'mentari-tv' = 'https://i.ibb.co.com/09LFvJ3/image.png'
  'garuda-tv' = 'https://i.ibb.co.com/gTsLtYk/image.png'
  'nusantara-tv' = 'https://i.ibb.co.com/gTsLtYk/image.png'
}

# Also re-download the ones from IBB/postimg
$reDL['moji'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moji_blue.svg/500px-Moji_blue.svg.png'
$reDL['cnn-indonesia'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/CNN_Indonesia_logo.svg/500px-CNN_Indonesia_logo.svg.png'
$reDL['sinpo-tv'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Sin_Po_TV.svg/500px-Sin_Po_TV.svg.png'
$reDL['mdtv'] = 'https://www.mncvision.id/userfiles/image/channel/channel_116.png'
$reDL['kix'] = 'https://www.mncvision.id/userfiles/image/channel/channel_161.png'
$$reDL['studio-universal'] = 'https://www.mncvision.id/userfiles/image/channel/channel_26.png'

Write-Output "Re-downloading originals..."
foreach ($slug in $reDL.Keys) {
  $url = $reDL[$slug]
  try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add('User-Agent', 'Mozilla/5.0')
    $buf = $wc.DownloadData($url)
    if ($buf.Length -gt 500 -and $buf[0] -eq 0x89) {
      [System.IO.File]::WriteAllBytes("$origDir\$slug.png", $buf)
    }
  } catch {}
}
