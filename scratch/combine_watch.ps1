# PowerShell script to combine watch SVG components into a single watch SVG file

$watchFolder = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\watch"
if (!(Test-Path $watchFolder)) {
    New-Item -ItemType Directory -Path $watchFolder
}

# Paths to the illustration SVGs
$v4Path = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\assets\illustration-Vector-4.svg"
$v6Path = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\assets\illustration-Vector-6.svg"
$v28Path = "c:\Users\Mass\Downloads\theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm\assets\illustration-Vector-28.svg"

# Extract path data
function Get-SvgPath($filePath) {
    $content = Get-Content $filePath -Raw
    if ($content -match '<path[^>]*d="([^"]+)"') {
        return $Matches[1]
    }
    return ""
}

$path4 = Get-SvgPath $v4Path
$path6 = Get-SvgPath $v6Path
$path28 = Get-SvgPath $v28Path

# Generate combined SVG with our calculated center alignment offsets
$combinedSvg = @"
<svg width="354" height="69" viewBox="0 0 354 69" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Watch Strap & Case -->
  <path d="$path4" fill="black"/>
  
  <!-- Watch Dial Markings & Hands -->
  <path d="$path6" fill="black" transform="translate(158.2, 5.8)"/>
  
  <!-- Watch Dial Rings & Stitching -->
  <path d="$path28" fill="black" transform="translate(159.2, 2.5)"/>
</svg>
"@

$targetFile = Join-Path $watchFolder "watch.svg"
Set-Content -Path $targetFile -Value $combinedSvg -Encoding utf8
Write-Output "Combined watch SVG generated successfully at $targetFile"
