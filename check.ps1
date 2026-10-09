$response = Invoke-RestMethod -Uri "https://dcrhvmewmpgtmdswofxs.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcmh2bWV3bXBndG1kc3dvZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTY1NTEsImV4cCI6MjA4OTA3MjU1MX0.PtpFXSHl1iOoqv19AEE_OYeI1CbmwKMcpgLH2i-r-Bw" -Method Get
$response.definitions.master_uats | ConvertTo-Json -Depth 5
$response.definitions.cliente_proy | ConvertTo-Json -Depth 5
