# Rebuild the code-authored pixel atlas on Windows using the installed Japanese
# system font. Only artwork is rasterized; all hit targets stay in the app.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
 $data = (node scripts/pixel-world-map-data.mjs | Out-String) | ConvertFrom-Json
 if ($LASTEXITCODE -ne 0) { throw 'Could not load pixel atlas data' }
 $bitmap=[System.Drawing.Bitmap]::new(1452,1083)
 $g=[System.Drawing.Graphics]::FromImage($bitmap)
 $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
 $g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 $ink='#29485b';$paper='#f4ecd2';$water='#164c63';$wave='#49778a'
 $g.Clear([System.Drawing.ColorTranslator]::FromHtml($water))
 function Rect($x,$y,$w,$h,$color) {
  $b=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($color))
  $g.FillRectangle($b,[single]$x,[single]$y,[single]$w,[single]$h);$b.Dispose()
 }
 function Text($label,$x,$y,$size,$color,$maxWidth=0) {
  $font=[System.Drawing.Font]::new('Yu Gothic',[single]$size,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  while($maxWidth -gt 0 -and $g.MeasureString($label,$font).Width -gt $maxWidth) {
   $size--; $font.Dispose();$font=[System.Drawing.Font]::new('Yu Gothic',[single]$size,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  }
  $brush=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($color))
  $format=[System.Drawing.StringFormat]::new();$format.Alignment=[System.Drawing.StringAlignment]::Center
  $g.DrawString([string]$label,$font,$brush,[single]$x,[single]$y,$format)
  $format.Dispose();$brush.Dispose();$font.Dispose()
 }
 function Polygon($points,$color) {
  $brush=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($color))
  $g.FillPolygon($brush,[System.Drawing.PointF[]]$points);$brush.Dispose()
 }
 function Stamp($sprite,$x,$y,$size,$body,$accent) {
  $rows=$sprite.rows;$cols=($rows | ForEach-Object {$_.Length} | Measure-Object -Maximum).Maximum
  $scale=[Math]::Max(1,[Math]::Floor($size/[Math]::Max($cols,$rows.Count)))
  $ox=$x+($size-$cols*$scale)/2;$oy=$y+($size-$rows.Count*$scale)/2
  $colors=@{X=$ink;B=$body;A=$accent;F=$paper;R='#b08b70'}
  for($yy=0;$yy -lt $rows.Count;$yy++){for($xx=0;$xx -lt $rows[$yy].Length;$xx++){
   $char=[string]$rows[$yy][$xx];if($char -ne '.') {Rect ($ox+$xx*$scale) ($oy+$yy*$scale) $scale $scale $colors[$char]}
  }}
 }
 # A restrained stepped frame, quiet water symbols, no gradients or sparkles.
 Rect 8 8 1436 4 $wave;Rect 8 1071 1436 4 $wave;Rect 8 8 4 1067 $wave;Rect 1440 8 4 1067 $wave
 foreach($wavePos in @(@(320,86),@(700,90),@(1032,86),@(328,320),@(688,320),@(1024,320),@(328,552),@(688,552),@(1032,552),@(328,784),@(688,784),@(1032,784),@(200,1032),@(660,1032),@(1080,1032))) {
  $x=$wavePos[0];$y=$wavePos[1];Rect $x $y 12 4 $wave;Rect ($x+12) ($y-4) 12 4 $wave;Rect ($x+24) $y 12 4 $wave
 }
 # Discrete square dashes, following exactly the existing fifteen connections.
 foreach($route in $data.connections){$step=0
  for($i=0;$i -lt $route.points.Count-1;$i++){
   $a=$route.points[$i];$b=$route.points[$i+1];$length=[Math]::Abs($b.x-$a.x)+[Math]::Abs($b.y-$a.y)
   for($d=0;$d -le $length;$d+=4){if(($step%4) -lt 2){$t=if($length){$d/$length}else{0};Rect ([Math]::Round(($a.x+($b.x-$a.x)*$t)/4)*4-2) ([Math]::Round(($a.y+($b.y-$a.y)*$t)/4)*4-2) 6 6 $paper};$step++}
  }
 }
 $outline=@(@(-132,-20),@(-120,-20),@(-120,-48),@(-96,-48),@(-96,-64),@(-56,-64),@(-56,-76),@(-16,-76),@(-16,-68),@(28,-68),@(28,-80),@(60,-80),@(60,-68),@(96,-68),@(96,-48),@(120,-48),@(120,-20),@(132,-20),@(132,24),@(120,24),@(120,40),@(88,40),@(88,48),@(-88,48),@(-88,40),@(-120,40),@(-120,24),@(-132,24))
 for($index=0;$index -lt 16;$index++){
  $island=$data.islands[$index];$cx=$data.centers[$index].x;$cy=$data.centers[$index].y
  foreach($layer in @(@(1,0,$ink),@(.97,0,$paper),@(.94,0,$island.land))){
   $points=foreach($point in $outline){[System.Drawing.PointF]::new(($cx+[Math]::Round($point[0]*$layer[0]/4)*4),($cy+[Math]::Round($point[1]*$layer[0]/4)*4))};Polygon $points $layer[2]
  }
  # Labyrinth contour and maze paths are the island's main landmark.
  if($island.id -eq 'j1') {
   Stamp $island.motifs[0] ($cx-116) ($cy-58) 96 $island.accent $island.accent
   Stamp $island.motifs[1] ($cx+2) ($cy-36) 52 $island.accent $island.accent
   Stamp $island.motifs[2] ($cx+64) ($cy-36) 52 $island.accent $island.accent
  } else {for($m=0;$m -lt 3;$m++){Stamp $island.motifs[$m] ($cx-110+$m*78) ($cy-48) 64 $island.accent $island.accent}}
  # Stepped paper label: type remains smooth and readable, not pixel-distorted.
  Rect ($cx-128) ($cy+48) 256 52 $ink;Rect ($cx-124) ($cy+44) 248 60 $ink
  Rect ($cx-124) ($cy+48) 248 52 $paper;Rect ($cx-120) ($cy+44) 240 60 $paper
  Text ($island.number+'  '+$island.grade) $cx ($cy+46) 18 $ink 238
  Text $island.name $cx ($cy+69) 24 $ink 240
 }
 # North marker stays in the upper-left; only its shape is now stepped.
 Rect 78 29 4 66 $paper;Rect 47 60 66 4 $paper
 Rect 78 30 4 8 $paper;Rect 74 38 12 8 $paper;Rect 70 46 20 8 $paper;Rect 66 54 28 4 $paper
 Rect 72 54 16 16 $wave;Rect 76 58 8 8 $paper
 Text 'N' 80 9 18 $paper;Text 'W' 33 53 15 $paper;Text 'E' 126 53 15 $paper;Text 'S' 80 94 15 $paper
 Text '数のトビラ 世界地図' 735 14 38 $paper 850
 Text 'world map' 1245 23 27 $paper
 Rect 458 70 520 4 $paper;Rect 446 74 12 4 $paper;Rect 978 74 12 4 $paper
 Rect 1164 68 160 4 $wave
 $bitmap.Save((Join-Path $root 'public/world-map-approved.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$bitmap.Dispose()
 $hash=(Get-FileHash public/world-map-approved.png -Algorithm SHA256).Hash.ToLowerInvariant()
 $meta=Get-Content src/domain/approvedWorldMap.ts -Raw
 $meta=$meta -replace "sha256: '[a-f0-9]{64}'",("sha256: '"+$hash+"'")
 $meta=$meta -replace 'png\?v=[a-f0-9]{8}',('png?v='+$hash.Substring(0,8))
 [System.IO.File]::WriteAllText((Join-Path $root 'src/domain/approvedWorldMap.ts'),$meta,[System.Text.UTF8Encoding]::new($false))
 Write-Output "Built pixel world map: $hash"
} finally {Pop-Location}
