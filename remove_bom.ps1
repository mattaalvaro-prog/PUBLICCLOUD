$path = "c:\Portal OPE\app.js"
$content = [System.IO.File]::ReadAllText($path)
$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
Write-Host "BOM Removed"
