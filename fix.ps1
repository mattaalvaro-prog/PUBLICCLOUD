$lines = Get-Content 'c:\Portal OPE\app.js' -Encoding UTF8
$idx = -1
for ($i=0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^function updateCarouselUI\(\) \{') {
        $idx = $i
        break
    }
}
if ($idx -ne -1) {
    $lines[0..($idx - 1)] | Out-File 'c:\Portal OPE\app.js' -Encoding UTF8
    Get-Content 'c:\Portal OPE\tail.js' -Encoding UTF8 | Add-Content 'c:\Portal OPE\app.js' -Encoding UTF8
    Write-Host 'Fixed.'
} else {
    Write-Host 'Not found.'
}
