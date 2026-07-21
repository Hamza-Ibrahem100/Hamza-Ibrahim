# PowerShell script to combine all SVG illustrations into a single SVG file matching the positions in gift-guide-hero.liquid

$targetFile = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\assets\gift-guide-background.svg"
$svgFolder = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\Test for Candidates (1)"

# Define layout items with their style parameters from our liquid code
$items = @(
    @{ Name="Vector.svg"; Top=-2; Left=1; Width=5 }
    @{ Name="Vector-1.svg"; Top=-4; Left=7; Width=14 }
    @{ Name="Vector-3.svg"; Top=6; Left=6; Width=10 }
    @{ Name="Vector-4.svg"; Top=38; Left=-1; Width=26 }
    @{ Name="Vector-5.svg"; Top=5; Left=36; Width=21 }
    @{ Name="Vector-6.svg"; Top=42; Left=8; Width=13 }
    @{ Name="Vector-7.svg"; Top=2; Left=30; Width=12 }
    @{ Name="Vector-8.svg"; Top=2; Left=13; Width=23 }
    @{ Name="Vector-9.svg"; Top=-3; Left=60; Width=10 }
    @{ Name="Vector-10.svg"; Top=16; Left=56; Width=19 }
    @{ Name="Vector-11.svg"; Top=36; Left=55; Width=52 }
    @{ Name="Vector-12.svg"; Top=10; Left=88; Width=3 }
    @{ Name="Vector-13.svg"; Top=35; Left=42; Width=16 }
    @{ Name="Vector-14.svg"; Top=12; Left=84; Width=9 }
    @{ Name="Vector-15.svg"; Top=48; Left=-2; Width=26 }
    @{ Name="Vector-16.svg"; Top=25; Left=92; Width=7 }
    @{ Name="Vector-17.svg"; Top=78; Left=90; Width=4 }
    @{ Name="Vector-18.svg"; Top=82; Left=96; Width=2.5 }
    @{ Name="Vector-19.svg"; Top=-2; Left=48; Width=13 }
    @{ Name="Vector-22.svg"; Top=-8; Left=-2; Width=15 }
    @{ Name="Vector-23.svg"; Top=28; Left=26; Width=18 }
    @{ Name="Vector-24.svg"; Top=86; Left=0; Width=65 }
    @{ Name="Vector-25.svg"; Top=55; Left=5; Width=1.2 }
    @{ Name="Vector-26.svg"; Top=30; Left=78; Width=6 }
    @{ Name="Vector-27.svg"; Top=65; Left=35; Width=1.2 }
    @{ Name="Vector-28.svg"; Top=52; Left=38; Width=8.5 }
    @{ Name="Vector-29.svg"; Top=58; Left=42; Width=1.7 }
    @{ Name="Vector-30.svg"; Top=14; Left=5; Width=16 }
    @{ Name="Vector-31.svg"; Top=5; Left=82; Width=9 }
    @{ Name="Vector-32.svg"; Top=55; Left=62; Width=46 }
    @{ Name="Vector-33.svg"; Top=72; Left=8; Width=3 }
    @{ Name="Vector-34.svg"; Top=68; Left=2; Width=7 }
    @{ Name="Vector-35.svg"; Top=64; Left=12; Width=5 }
    @{ Name="Vector-36.svg"; Top=42; Left=40; Width=22 }
    @{ Name="Vector-37.svg"; Top=35; Left=72; Width=13 }
    @{ Name="Vector-2.svg"; Top=75; Left=18; Width=4 }
)

$viewBoxWidth = 1440
$viewBoxHeight = 620

$svgContent = "<svg viewBox=""0 0 $viewBoxWidth $viewBoxHeight"" fill=""none"" xmlns=""http://www.w3.org/2000/svg"">`n"

foreach ($item in $items) {
    $filePath = Join-Path $svgFolder $item.Name
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Extract original viewBox or width/height
        $origWidth = 100
        $origHeight = 100
        if ($content -match 'viewBox="0 0 (\d+(\.\d+)?) (\d+(\.\d+)?)"') {
            $origWidth = [double]$Matches[1]
            $origHeight = [double]$Matches[3]
        } elseif ($content -match 'width="(\d+)".*?height="(\d+)"') {
            $origWidth = [double]$Matches[1]
            $origHeight = [double]$Matches[2]
        }
        
        # Calculate pixel coordinates in the 1440x620 grid
        $x = ($item.Left / 100.0) * $viewBoxWidth
        $y = ($item.Top / 100.0) * $viewBoxHeight
        $w = ($item.Width / 100.0) * $viewBoxWidth
        # Maintain aspect ratio for height
        $h = $w * ($origHeight / $origWidth)
        
        # Extract the inner SVG elements (paths, circles, etc.)
        $inner = $content
        $inner = $inner -replace '(?s)<svg[^>]*>', ''
        $inner = $inner -replace '</svg>', ''
        $inner = $inner.Trim()
        
        # Wrap in a nested <svg> with calculated bounds to scale perfectly
        $svgContent += "  <!-- $($item.Name) -->`n"
        $svgContent += "  <svg x=""$([Math]::Round($x, 2))"" y=""$([Math]::Round($y, 2))"" width=""$([Math]::Round($w, 2))"" height=""$([Math]::Round($h, 2))"" viewBox=""0 0 $origWidth $origHeight"">`n"
        $svgContent += "    $inner`n"
        $svgContent += "  </svg>`n"
    } else {
        Write-Warning "File not found: $filePath"
    }
}

$svgContent += "</svg>"
Set-Content -Path $targetFile -Value $svgContent -Encoding utf8
Write-Output "Combined SVG generated successfully at $targetFile"
