$text = [System.IO.File]::ReadAllText('c:\Portal OPE\app.js')
$open = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
$close = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
Write-Host "Open: $open"
Write-Host "Close: $close"
