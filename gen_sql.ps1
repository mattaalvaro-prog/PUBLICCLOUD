$csvPath = "c:\Portal OPE\Genral_uats.csv"
$outputPath = "c:\Portal OPE\general_uats_parte_{0}.sql"

$createTable = @"
-- Table Definition for general_uats
CREATE TABLE IF NOT EXISTS general_uats (
    id SERIAL PRIMARY KEY,
    id_lob VARCHAR(100),
    id_casop VARCHAR(50),
    id_bp VARCHAR(50),
    proceso_scope_item TEXT,
    escenario TEXT,
    actividades_proceso TEXT,
    precondiciones TEXT,
    pasos_detallados TEXT,
    datos_prueba TEXT,
    resultado_esperado TEXT
);
"@

$columns = "(id_lob, id_casop, id_bp, proceso_scope_item, escenario, actividades_proceso, precondiciones, pasos_detallados, datos_prueba, resultado_esperado)"

function Clean($text) {
    if ([string]::IsNullOrWhiteSpace($text)) { return "NULL" }
    $cleaned = $text.Replace("'", "''").Trim()
    return "'$cleaned'"
}

$lines = Get-Content $csvPath -Encoding Latin1
$header = $lines[0]
$dataLines = $lines | Select-Object -Skip 1

$fileCount = 1
$rowCount = 0
$batchCount = 0
$currentRows = @()

$sw = [System.IO.StreamWriter]::new([string]::Format($outputPath, $fileCount))
$sw.WriteLine($createTable)

foreach ($line in $dataLines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $cols = $line.Split(';')
    if ($cols.Count -lt 10) { continue }
    
    $id_casop = $cols[1]
    if ([string]::IsNullOrWhiteSpace($id_casop)) { continue }

    $vals = @(
        Clean($cols[0]), # id_lob
        Clean($cols[1]), # id_casop
        Clean($cols[2]), # id_bp
        Clean($cols[3]), # scope_item
        Clean($cols[4]), # escenario
        Clean($cols[5]), # actividades_proceso
        Clean($cols[6]), # precondiciones
        Clean($cols[7]), # pasos_detallados
        Clean($cols[8]), # datos_prueba
        Clean($cols[9])  # resultado_esperado
    )

    $currentRows += "($($vals -join ','))"
    $rowCount++
    $batchCount++

    if ($batchCount -ge 50) {
        $sw.WriteLine("INSERT INTO general_uats $columns VALUES")
        $sw.WriteLine(($currentRows -join ",`n") + ";")
        $sw.WriteLine()
        $currentRows = @()
        $batchCount = 0
    }

    if ($rowCount -ge 500) {
        if ($currentRows.Count -gt 0) {
            $sw.WriteLine("INSERT INTO general_uats $columns VALUES")
            $sw.WriteLine(($currentRows -join ",`n") + ";")
            $currentRows = @()
        }
        $sw.Close()
        Write-Host "Generated part $fileCount"
        $fileCount++
        $rowCount = 0
        $batchCount = 0
        $sw = [System.IO.StreamWriter]::new([string]::Format($outputPath, $fileCount))
        $sw.WriteLine("-- Continuation of data import for general_uats")
    }
}

if ($currentRows.Count -gt 0) {
    $sw.WriteLine("INSERT INTO general_uats $columns VALUES")
    $sw.WriteLine(($currentRows -join ",`n") + ";")
}

$sw.Close()
Write-Host "Generated part $fileCount"
Write-Host "Done!"
