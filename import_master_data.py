import pandas as pd
import psycopg2
import os

# --- Configuración de Base de Datos ---
DB_USER = "postgres"
DB_PASS = "admin" # Update with actual DB password
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "altim_portal_cloud"

# --- Archivos Fuente ---
FILES = {
    "uats_file": "ALTIM_UATs_CHECK LIST  BEST PRACTICE para 2508_20251210.xlsx",
    "bpml_file": "BPML_S4HC_PublicCloud.xlsx",
    "questionnaire_file": "S4H_BDC Questionnaire.xlsx",
    "best_practice_file": "PRERARA_BEST PRACTICE.xlsx"
}

def connect_db():
    conn = psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
    )
    return conn

def import_uats():
    print("Importando UATs...")
    try:
        # Check if file exists in the directory
        if not os.path.exists(FILES["uats_file"]):
            print(f"Archivo {FILES['uats_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["uats_file"], sheet_name=0)
        conn = connect_db()
        cursor = conn.cursor()
        
        # Simulating matching columns. Typically 'UAT ID' or similar, plus 'Description'.
        # Since actual column names in the provided excel are unknown, assuming generic parsing index for snippet.
        for index, row in df.iterrows():
            uat_code = str(row.iloc[0])[:50]
            desc = str(row.iloc[1])
            if pd.isna(uat_code) or uat_code == "nan": continue
            
            try:
                cursor.execute(
                    "INSERT INTO master_uats (uat_code, description, status) VALUES (%s, %s, %s) ON CONFLICT (uat_code) DO NOTHING",
                    (uat_code, desc, 'Pendiente')
                )
            except Exception as e:
                print(f"Error insertando UAT {uat_code}: {e}")
                
        conn.commit()
        cursor.close()
        conn.close()
        print("Importación UATs completada.")
    except Exception as e:
        print(f"Error procesando UATs: {e}")

def import_bpml():
    print("Importando BPML...")
    try:
        if not os.path.exists(FILES["bpml_file"]):
            print(f"Archivo {FILES['bpml_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["bpml_file"], sheet_name=0)
        conn = connect_db()
        cursor = conn.cursor()
        
        for index, row in df.iterrows():
            process_id = str(row.iloc[0])[:50]
            process_group = str(row.iloc[1])[:100]
            process_name = str(row.iloc[2])[:255]
            if pd.isna(process_id) or process_id == "nan": continue
            
            try:
                cursor.execute(
                    "INSERT INTO master_bpml (process_id, process_group, process_name) VALUES (%s, %s, %s) ON CONFLICT (process_id) DO NOTHING",
                    (process_id, process_group, process_name)
                )
            except Exception as e:
                pass
                
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error procesando BPML: {e}")


def import_questionnaire():
    print("Importando Cuestionario...")
    try:
        if not os.path.exists(FILES["questionnaire_file"]):
            print(f"Archivo {FILES['questionnaire_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["questionnaire_file"], sheet_name=0)
        conn = connect_db()
        cursor = conn.cursor()
        
        for index, row in df.iterrows():
            question_id = str(row.iloc[0])[:50]
            q_text = str(row.iloc[1])
            cat = str(row.iloc[2])[:100] if len(row) > 2 else "General"
            
            if pd.isna(question_id) or question_id == "nan": continue
            
            try:
                cursor.execute(
                    "INSERT INTO master_questionnaire (question_id, question_text, category) VALUES (%s, %s, %s) ON CONFLICT (question_id) DO NOTHING",
                    (question_id, q_text, cat)
                )
            except Exception as e:
                pass
                
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error procesando Questionnaire: {e}")

def import_best_practice():
    print("Importando Best Practices...")
    try:
        if not os.path.exists(FILES["best_practice_file"]):
            print(f"Archivo {FILES['best_practice_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["best_practice_file"], sheet_name=0)
        conn = connect_db()
        cursor = conn.cursor()
        
        for index, row in df.iterrows():
            bp_code = str(row.iloc[0])[:50]
            desc = str(row.iloc[1])
            lob = str(row.iloc[2])[:50] if len(row) > 2 else "GEN"
            
            if pd.isna(bp_code) or bp_code == "nan": continue
            
            try:
                cursor.execute(
                    "INSERT INTO master_best_practice (bp_code, description, lob) VALUES (%s, %s, %s) ON CONFLICT (bp_code) DO NOTHING",
                    (bp_code, desc, lob)
                )
            except Exception as e:
                pass
                
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error procesando Best Practices: {e}")

if __name__ == "__main__":
    print("Iniciando importación de datos maestros a PostgreSQL...\n")
    import_uats()
    import_bpml()
    import_questionnaire()
    import_best_practice()
    print("\nProceso finalizado.")
