-- Setup script for General_BPML table

CREATE TABLE IF NOT EXISTS public.general_bpml (
    bpml_id TEXT PRIMARY KEY,
    id_e2e TEXT,
    negocio TEXT,
    grupo_proceso_l1 TEXT,
    grupo_proceso_l2 TEXT,
    nombre_proceso_l3 TEXT,
    id_bp TEXT,
    nombre_scope_item_sap_best_practice TEXT,
    nombre_proceso_l4 TEXT,
    estructura_organizativa_objetivo TEXT,
    evento_desencadenante TEXT,
    evento_final_resultado TEXT,
    rol_negocio_principal TEXT,
    objetos_datos_clave TEXT,
    reglas_negocio_clave TEXT,
    integraciones_estandar TEXT,
    controles_clave TEXT,
    kpis_clave TEXT,
    seleccionado BOOLEAN DEFAULT false
);

-- Configurar los permisos básicos de Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE public.general_bpml TO anon;
GRANT ALL ON TABLE public.general_bpml TO authenticated;
GRANT ALL ON TABLE public.general_bpml TO service_role;
