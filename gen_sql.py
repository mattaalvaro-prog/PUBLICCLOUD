import csv
import sys

csv_file = r'c:\Portal OPE\Genral_uats.csv'

create_table = """
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

-- Uncomment to clear existing data before first part import
-- TRUNCATE TABLE general_uats;
"""

mapping = {
    'id_lob': 'id_lob',
    'id_casop': 'id_casop',
    'id_bp': 'id_bp',
    'scope_item': 'proceso_scope_item',
    'escenario': 'escenario',
    'actividades_proceso': 'actividades_proceso',
    'precondiciones': 'precondiciones',
    'pasos_detallados': 'pasos_detallados',
    'datos_prueba': 'datos_prueba',
    'resultado_sperado': 'resultado_esperado'
}

def clean(text):
    if not text:
        return 'NULL'
    # Escape single quotes for SQL
    return "'" + text.replace("'", "''").strip() + "'"

try:
    with open(csv_file, 'r', encoding='latin-1') as f_in:
        reader = csv.DictReader(f_in, delimiter=';')
        
        file_count = 1
        row_count = 0
        rows = []
        columns = "(id_lob, id_casop, id_bp, proceso_scope_item, escenario, actividades_proceso, precondiciones, pasos_detallados, datos_prueba, resultado_esperado)"

        def get_sql_filename(count):
            return f'c:\\Portal OPE\\general_uats_parte_{count}.sql'

        out = open(get_sql_filename(file_count), 'w', encoding='utf-8')
        out.write(create_table)
        
        for row in reader:
            # Skip if id_casop is empty
            if not row.get('id_casop') or row['id_casop'].strip() == "":
                continue
            
            # Map values
            vals = [clean(row.get(old, '')) for old in mapping.keys()]
            rows.append(f"({','.join(vals)})")
            row_count += 1
            
            # Batch inserts every 50 rows
            if len(rows) >= 50:
                out.write(f"INSERT INTO general_uats {columns} VALUES\n")
                out.write(",\n".join(rows) + ";\n\n")
                rows = []
            
            # Split into a new file every 500 rows
            if row_count >= 500:
                if rows:
                    out.write(f"INSERT INTO general_uats {columns} VALUES\n")
                    out.write(",\n".join(rows) + ";\n")
                    rows = []
                
                out.close()
                print(f"SQL file generated at {get_sql_filename(file_count)}")
                file_count += 1
                row_count = 0
                out = open(get_sql_filename(file_count), 'w', encoding='utf-8')
                out.write("-- Continuation of data import for general_uats\n")
        
        # Remaining rows
        if rows:
            out.write(f"INSERT INTO general_uats {columns} VALUES\n")
            out.write(",\n".join(rows) + ";\n")
        
        out.close()
        print(f"SQL file generated at {get_sql_filename(file_count)}")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
