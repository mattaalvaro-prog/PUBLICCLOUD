-- ========================================================
-- ALTIM PORTAL CLOUD - ESQUEMA COMPLETO Y ACTUALIZADO (SUPABASE)
-- Generado automáticamente a partir de information_schema
-- Total tablas y vistas: 36
-- ========================================================

CREATE TABLE IF NOT EXISTS General_questionarie (
    "ID_Cuestionario" integer NOT NULL DEFAULT nextval('"General_questionarie_ID_Cuestionario_seq"'::regclass),
    "Area" character varying,
    id_lob character varying,
    "PREGUNTA" text,
    "Descripcion" text,
    "Id_idioma" character varying
);

CREATE TABLE IF NOT EXISTS api_credentials_vault (
    id integer NOT NULL DEFAULT nextval('api_credentials_vault_id_seq'::regclass),
    key_name character varying NOT NULL,
    key_value text,
    description text,
    category character varying,
    is_secret boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying
);

CREATE TABLE IF NOT EXISTS cliente_proy (
    id integer NOT NULL DEFAULT nextval('cliente_proy_id_seq'::regclass),
    client_id integer,
    id_proyecto character varying NOT NULL,
    descripcion_prj character varying,
    sharepoint_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    go_live_date date,
    support_start_date date,
    support_end_date date
);

CREATE TABLE IF NOT EXISTS clients (
    id integer NOT NULL DEFAULT nextval('clients_id_seq'::regclass),
    nombre_cliente character varying NOT NULL,
    abrev character varying NOT NULL,
    contacto character varying,
    mail character varying,
    tel character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    abreviatura_3 character varying
);

CREATE TABLE IF NOT EXISTS documentos (
    id integer NOT NULL DEFAULT nextval('documentos_id_seq'::regclass),
    cliente character varying,
    proyecto character varying,
    id_fase character varying,
    tipo_documento character varying,
    numerador character varying,
    url text,
    id_lob character varying,
    nombre_taller character varying,
    fecha date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_bpml (
    bpml_id text NOT NULL,
    id_e2e text,
    negocio text,
    grupo_proceso_l1 text,
    grupo_proceso_l2 text,
    nombre_proceso_l3 text,
    id_bp text,
    nombre_scope_item_sap_best_practice text,
    nombre_proceso_l4 text,
    estructura_organizativa_objetivo text,
    evento_desencadenante text,
    evento_final_resultado text,
    rol_negocio_principal text,
    objetos_datos_clave text,
    reglas_negocio_clave text,
    integraciones_estandar text,
    controles_clave text,
    kpis_clave text,
    seleccionado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS general_uats (
    id integer NOT NULL DEFAULT nextval('general_uats_id_seq'::regclass),
    id_lob character varying,
    id_casop character varying,
    id_bp character varying,
    proceso_scope_item text,
    escenario text,
    actividades_proceso text,
    precondiciones text,
    pasos_detallados text,
    datos_prueba text,
    resultado_esperado text
);

CREATE TABLE IF NOT EXISTS incidencias (
    id integer NOT NULL DEFAULT nextval('incidencias_id_seq'::regclass),
    numero_incidencia character varying NOT NULL,
    cliente_id integer,
    proyecto_id integer,
    fecha_incid date DEFAULT CURRENT_DATE,
    resp_cliente character varying,
    tipo character varying,
    tipo_altim character varying,
    lob character varying,
    descripcion text,
    error_mensaje text,
    observaciones text,
    prioridad character varying,
    comentarios text,
    sistema character varying,
    resp_altim character varying,
    estado character varying,
    fecha_entrega date,
    fecha_cierre date,
    comentarios_finales text,
    responsable character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_audit_logs (
    id integer NOT NULL DEFAULT nextval('incident_audit_logs_id_seq'::regclass),
    incident_id integer,
    usuario_email character varying,
    accion character varying,
    campo_modificado character varying,
    valor_anterior text,
    valor_nuevo text,
    timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_best_practice (
    id integer NOT NULL DEFAULT nextval('master_best_practice_id_seq'::regclass),
    id_lob character varying NOT NULL,
    denominacion_bp text NOT NULL,
    id_bp character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS master_bpml (
    id integer NOT NULL DEFAULT nextval('master_bpml_id_seq'::regclass),
    bpml_id text NOT NULL,
    id_e2e character varying,
    negocio character varying,
    grupo_proceso_l2 text,
    nombre_proceso_l3 text,
    id_bp character varying,
    nombre_scope_item_sap_best_practice text,
    estructura_organizativa_objetivo text,
    evento_desencadenante text,
    evento_final_resultado text,
    rol_negocio_principal text,
    objetos_datos_clave text,
    reglas_negocio_clave text,
    integraciones_estandar text,
    controles_clave text,
    kpis_clave text,
    priority character varying,
    sprint character varying,
    estado_ajuste_fpg character varying,
    ids_referencia_gap character varying,
    notas_enlace_evidencia text,
    grupo_proceso_l1 text,
    nombre_proceso_l4 text,
    id_proyecto text NOT NULL,
    seleccionado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS master_fases (
    id integer NOT NULL DEFAULT nextval('master_fases_id_seq'::regclass),
    fase_name character varying NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    nueva_fecha_inicio date,
    nueva_fecha_fin date
);

CREATE TABLE IF NOT EXISTS master_jira_categories (
    id integer NOT NULL DEFAULT nextval('master_jira_categories_id_seq'::regclass),
    category_name character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS master_lobs (
    id integer NOT NULL DEFAULT nextval('master_lobs_id_seq'::regclass),
    id_lob character varying NOT NULL,
    id_idioma character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS master_project_types (
    id integer NOT NULL DEFAULT nextval('master_project_types_id_seq'::regclass),
    type_name character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS master_questionnaire (
    id integer NOT NULL DEFAULT nextval('master_questionnaire_id_seq'::regclass),
    lob_id character varying,
    project_relevant character varying,
    scope_ref text,
    sap_id character varying,
    sscui_reference text,
    area character varying,
    topic text,
    topic_definition text,
    question text NOT NULL,
    level character varying,
    solution text,
    customers_response text
);

CREATE TABLE IF NOT EXISTS master_roles (
    id integer NOT NULL DEFAULT nextval('master_roles_id_seq'::regclass),
    role_name character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS master_uats (
    id integer NOT NULL DEFAULT nextval('master_uats_id_seq'::regclass),
    id_lob character varying,
    id_casop character varying,
    id_bp character varying,
    proceso_scope_item text,
    escenario text,
    actividades_proceso text,
    precondiciones text,
    pasos_detallados text,
    datos_prueba text,
    resultado_esperado text,
    resultado_obtenido text,
    estado_ok_nok character varying,
    defecto_asociado character varying,
    tipo_prueba character varying,
    rol_perfil_responsable character varying,
    id_requisito_historia character varying,
    raci character varying,
    project_id integer
);

CREATE TABLE IF NOT EXISTS project_notifications (
    id bigint NOT NULL,
    project_id character varying NOT NULL,
    text character varying NOT NULL,
    document_name character varying,
    url character varying,
    user_email character varying,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_phases (
    id integer NOT NULL DEFAULT nextval('project_phases_id_seq'::regclass),
    project_id integer,
    phase_name character varying NOT NULL,
    start_date date,
    end_date date,
    new_start_date date,
    new_end_date date,
    progress integer DEFAULT 0,
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_risks (
    id integer NOT NULL DEFAULT nextval('project_risks_id_seq'::regclass),
    project_id integer,
    riesgo_identificado text NOT NULL,
    causa text,
    probabilidad character varying,
    impacto character varying,
    prioridad integer DEFAULT 0,
    estrategia_respuesta text,
    plan_respuesta text,
    estado character varying DEFAULT 'Abierto'::character varying,
    comentarios text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_workshops (
    id integer NOT NULL DEFAULT nextval('project_workshops_id_seq'::regclass),
    project_id integer,
    group_id character varying NOT NULL,
    group_name character varying,
    scheduled_date date NOT NULL,
    color_idx integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    project_code character varying NOT NULL,
    name character varying NOT NULL,
    client_id integer,
    phase character varying,
    status character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_news (
    id integer NOT NULL DEFAULT nextval('public_news_id_seq'::regclass),
    title character varying NOT NULL,
    description text,
    url text NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    order_priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requerimientos (
    id bigint NOT NULL,
    project_id bigint,
    title text NOT NULL,
    description text,
    phase text,
    status text,
    assigned_to text,
    priority text,
    due_date date,
    color text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    responsable text
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id integer NOT NULL DEFAULT nextval('role_permissions_id_seq'::regclass),
    module_key character varying NOT NULL,
    user_type character varying NOT NULL,
    role_name character varying NOT NULL DEFAULT '#'::character varying,
    can_view boolean DEFAULT false,
    can_modify boolean DEFAULT false,
    can_download boolean DEFAULT false,
    can_attach boolean DEFAULT false,
    is_invisible boolean DEFAULT false,
    is_restricted boolean DEFAULT false,
    has_no_access boolean DEFAULT false,
    res_button text,
    res_parte text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    id integer NOT NULL DEFAULT nextval('system_config_id_seq'::regclass),
    key_name character varying NOT NULL,
    key_value text,
    description text,
    category character varying,
    is_secret boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying
);

CREATE TABLE IF NOT EXISTS task_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid,
    user_email text,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id bigint,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'OPEN'::text,
    phase text DEFAULT 'Discover'::text,
    assigned_to text,
    color text DEFAULT '#3498db'::text,
    priority text DEFAULT 'Medium'::text,
    due_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_client_relation (
    user_id integer NOT NULL,
    client_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_project_relation (
    user_id integer NOT NULL,
    project_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email character varying NOT NULL,
    password character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    role character varying,
    user_type character varying,
    cliente character varying,
    nombre_proyecto character varying,
    direccion text,
    telefono character varying,
    profile_image text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying DEFAULT 'active'::character varying
);

-- VISTA: view_user_assignments
-- Columnas: user_id (integer), user_email (character varying), client_id (integer), client_name (character varying), project_id (integer), project_code (character varying), project_name (character varying), assignment_type (text)

CREATE TABLE IF NOT EXISTS workshop_group_items (
    id integer NOT NULL DEFAULT nextval('workshop_group_items_id_seq'::regclass),
    group_record_id integer,
    bp_id character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshop_groups (
    id integer NOT NULL DEFAULT nextval('workshop_groups_id_seq'::regclass),
    project_id integer,
    group_id character varying NOT NULL,
    group_name character varying,
    id_lob character varying,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshops (
    id integer NOT NULL DEFAULT nextval('workshops_id_seq'::regclass),
    workshop_code character varying NOT NULL,
    lob character varying,
    description text
);
