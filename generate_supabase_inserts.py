import pandas as pd
import os
import math

# --- Configuración ---
SQL_OUTPUT_FILE = "supabase_data_load.sql"

# --- Archivos Fuente ---
FILES = {
    "uats_file": "ALTIM_UATs_CHECK LIST  BEST PRACTICE para 2508_20251210.xlsx",
    "bpml_file": "BPML_S4HC_PublicCloud.xlsx",
    "questionnaire_file": "S4H_BDC Questionnaire.xlsx",
    "best_practice_file": "PRERARA_BEST PRACTICE.xlsx"
}

def escape_sql(text):
    """Escapa comillas simples para evitar errores de sintaxis en SQL."""
    if pd.isna(text) or text == "" or text == "nan":
        return "NULL"
    
    # Convertir a string, eliminar saltos de línea innecesarios y escapar comillas
    safe_text = str(text).replace("'", "''").strip()
    return f"'{safe_text}'"

def append_to_sql_file(content):
    with open(SQL_OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(content + "\n")

def init_sql_file():
    with open(SQL_OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- --------------------------------------------------------\n")
        f.write("-- SCRIPT GENERADO PARA SUPABASE - CARGA DE DATOS MAESTROS\n")
        f.write("-- --------------------------------------------------------\n\n")

def generate_uats_sql():
    print("Generando SQL para UATs...")
    try:
        if not os.path.exists(FILES["uats_file"]):
            print(f"Archivo {FILES['uats_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["uats_file"], sheet_name=0)
        
        append_to_sql_file("-- Inserciones para master_uats")
        
        for index, row in df.iterrows():
            uat_code = str(row.iloc[0])[:50]
            desc = str(row.iloc[1])
            
            if pd.isna(row.iloc[0]) or str(row.iloc[0]) == "nan": continue
            
            sql = f"INSERT INTO public.master_uats (uat_code, description, status) VALUES ({escape_sql(uat_code)}, {escape_sql(desc)}, 'Pendiente') ON CONFLICT (uat_code) DO NOTHING;"
            append_to_sql_file(sql)
            
        append_to_sql_file("\n")
        print("SQL de UATs completado.")
    except Exception as e:
        print(f"Error procesando UATs: {e}")

def generate_bpml_sql():
    print("Generando SQL para BPML...")
    try:
        if not os.path.exists(FILES["bpml_file"]):
            print(f"Archivo {FILES['bpml_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["bpml_file"], sheet_name=0)
        
        append_to_sql_file("-- Inserciones para master_bpml")
        
        for index, row in df.iterrows():
            process_id = str(row.iloc[0])[:50]
            process_group = str(row.iloc[1])[:100]
            process_name = str(row.iloc[2])[:255]
            
            if pd.isna(row.iloc[0]) or str(row.iloc[0]) == "nan": continue
            
            sql = f"INSERT INTO public.master_bpml (process_id, process_group, process_name) VALUES ({escape_sql(process_id)}, {escape_sql(process_group)}, {escape_sql(process_name)}) ON CONFLICT (process_id) DO NOTHING;"
            append_to_sql_file(sql)
            
        append_to_sql_file("\n")
        print("SQL de BPML completado.")
    except Exception as e:
        print(f"Error procesando BPML: {e}")

def generate_questionnaire_sql():
    print("Generando SQL para Questionnaire...")
    try:
        if not os.path.exists(FILES["questionnaire_file"]):
            print(f"Archivo {FILES['questionnaire_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["questionnaire_file"], sheet_name=0)
        
        append_to_sql_file("-- Inserciones para master_questionnaire")
        
        for index, row in df.iterrows():
            question_id = str(row.iloc[0])[:50]
            q_text = str(row.iloc[1])
            cat = str(row.iloc[2])[:100] if len(row) > 2 else "General"
            
            if pd.isna(row.iloc[0]) or str(row.iloc[0]) == "nan": continue
            
            sql = f"INSERT INTO public.master_questionnaire (question_id, question_text, category) VALUES ({escape_sql(question_id)}, {escape_sql(q_text)}, {escape_sql(cat)}) ON CONFLICT (question_id) DO NOTHING;"
            append_to_sql_file(sql)
            
        append_to_sql_file("\n")
        print("SQL de Questionnaire completado.")
    except Exception as e:
        print(f"Error procesando Questionnaire: {e}")

def generate_best_practice_sql():
    print("Generando SQL para Best Practices...")
    try:
        if not os.path.exists(FILES["best_practice_file"]):
            print(f"Archivo {FILES['best_practice_file']} no encontrado. Saltando...")
            return
            
        df = pd.read_excel(FILES["best_practice_file"], sheet_name=0)
        
        append_to_sql_file("-- Inserciones para master_best_practice")
        
        for index, row in df.iterrows():
            bp_code = str(row.iloc[0])[:50]
            desc = str(row.iloc[1])
            lob = str(row.iloc[2])[:50] if len(row) > 2 else "GEN"
            
            if pd.isna(row.iloc[0]) or str(row.iloc[0]) == "nan": continue
            
            sql = f"INSERT INTO public.master_best_practice (bp_code, description, lob) VALUES ({escape_sql(bp_code)}, {escape_sql(desc)}, {escape_sql(lob)}) ON CONFLICT (bp_code) DO NOTHING;"
            append_to_sql_file(sql)
            
        append_to_sql_file("\n")
        print("SQL de Best Practices completado.")
    except Exception as e:
        print(f"Error procesando Best Practices: {e}")

if __name__ == "__main__":
    print(f"Iniciando generación de script {SQL_OUTPUT_FILE} para Supabase...\n")
    init_sql_file()
    generate_uats_sql()
    generate_bpml_sql()
    generate_questionnaire_sql()
    generate_best_practice_sql()
    print(f"\nProceso finalizado. El archivo {SQL_OUTPUT_FILE} ha sido generado exitosamente.")
