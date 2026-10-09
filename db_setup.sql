-- --------------------------------------------------------
-- ALTIM PORTAL CLOUD - INITIAL DATABASE SETUP (REFACTORED)
-- --------------------------------------------------------

-- CLEANUP (In case you need to re-run, this deletes old tables)
DROP TABLE IF EXISTS cliente_proy CASCADE;
DROP TABLE IF EXISTS master_bpml CASCADE;
DROP TABLE IF EXISTS master_uats CASCADE;
DROP TABLE IF EXISTS master_questionnaire CASCADE;
DROP TABLE IF EXISTS master_best_practice CASCADE;
DROP TABLE IF EXISTS master_lobs CASCADE;
DROP TABLE IF EXISTS master_roles CASCADE;
DROP TABLE IF EXISTS master_fases CASCADE;
DROP TABLE IF EXISTS master_jira_categories CASCADE;
DROP TABLE IF EXISTS master_project_types CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. CORE TABLES

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),
    user_type VARCHAR(50), -- Altim, Cliente
    cliente VARCHAR(255),
    nombre_proyecto VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    profile_image TEXT, -- Base64 or URL
    status VARCHAR(20) DEFAULT 'active', -- active, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    abrev VARCHAR(20) UNIQUE NOT NULL,
    contacto VARCHAR(255),
    mail VARCHAR(255),
    tel VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    phase VARCHAR(50),
    status VARCHAR(50),
    fecha_inicio_pre DATE,
    fecha_fin_pre DATE,
    nueva_fecha_fin_pre DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_proy (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    id_proyecto VARCHAR(30) UNIQUE NOT NULL,
    descripcion_prj VARCHAR(40),
    sharepoint_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MASTER DATA TABLES

CREATE TABLE master_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE master_fases (
    id SERIAL PRIMARY KEY,
    fase_name VARCHAR(50) UNIQUE NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    nueva_fecha_inicio DATE,
    nueva_fecha_fin DATE
);

CREATE TABLE master_jira_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE master_project_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE master_best_practice (
    id SERIAL PRIMARY KEY,
    id_lob VARCHAR(50),
    denominacion_bp TEXT,
    id_bp VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE master_uats (
    id SERIAL PRIMARY KEY,
    id_lob VARCHAR(50),
    id_casop VARCHAR(50) UNIQUE NOT NULL,
    id_bp VARCHAR(50),
    proceso_scope_item TEXT,
    escenario TEXT,
    actividades_proceso TEXT,
    precondiciones TEXT,
    pasos_detallados TEXT,
    datos_prueba TEXT,
    resultado_esperado TEXT,
    resultado_obtenido TEXT,
    estado_ok_nok VARCHAR(10),
    defecto_asociado VARCHAR(100),
    tipo_prueba VARCHAR(50),
    rol_perfil_responsable VARCHAR(100),
    id_requisito_historia VARCHAR(50),
    raci VARCHAR(50)
);

CREATE TABLE master_questionnaire (
    id SERIAL PRIMARY KEY,
    lob_id VARCHAR(50),
    project_relevant VARCHAR(10),
    scope_ref TEXT,
    sap_id VARCHAR(50),
    sscui_reference TEXT,
    area VARCHAR(100),
    topic TEXT,
    topic_definition TEXT,
    question TEXT NOT NULL,
    level VARCHAR(20),
    solution TEXT,
    customers_response TEXT
);

CREATE TABLE master_bpml (
    id SERIAL PRIMARY KEY,
    bpml_id VARCHAR(50) UNIQUE NOT NULL,
    id_e2e VARCHAR(50),
    negocio VARCHAR(100),
    grupo_proceso_l2 TEXT,
    nombre_proceso_l3 TEXT,
    id_bp VARCHAR(50),
    nombre_scope_item_sap_best_practice TEXT,
    estructura_organizativa_objetivo TEXT,
    evento_desencadenante TEXT,
    evento_final_resultado TEXT,
    rol_negocio_principal VARCHAR(100),
    objetos_datos_clave TEXT,
    reglas_negocio_clave TEXT,
    integraciones_estandar TEXT,
    controles_clave TEXT,
    kpis_clave TEXT,
    priority VARCHAR(20),
    sprint VARCHAR(50),
    estado_ajuste_fpg VARCHAR(10),
    ids_referencia_gap VARCHAR(100),
    notas_enlace_evidencia TEXT
);

CREATE TABLE master_lobs (
    id SERIAL PRIMARY KEY,
    id_lob VARCHAR(50) UNIQUE NOT NULL,
    id_idioma VARCHAR(10) NOT NULL
);

-- 3. PRE MODULE TABLES

CREATE TABLE project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    category VARCHAR(100) NOT NULL, -- Kick-Off, Matriz, Planificación, Plan Proyecto, etc.
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    completion_date DATE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workshop_groups (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    group_name VARCHAR(50) NOT NULL, -- WS-001, WS-002...
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE workshop_group_items (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES workshop_groups(id) ON DELETE CASCADE,
    bp_id VARCHAR(50) REFERENCES master_best_practice(id_bp)
);

CREATE TABLE project_agenda (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    agenda_date DATE NOT NULL,
    group_id INTEGER REFERENCES workshop_groups(id) ON DELETE CASCADE
);

CREATE TABLE lobs_starter_info (
    id SERIAL PRIMARY KEY,
    id_lob VARCHAR(50) REFERENCES master_lobs(id_lob),
    url TEXT NOT NULL,
    download_count INTEGER DEFAULT 0
);

-- 3. INITIAL DATA INSERTS

-- USERS
INSERT INTO users (email, password, first_name, last_name, role, user_type, cliente, nombre_proyecto) VALUES 
('adelamatta@altim.es', 'Altim-01', 'Alvaro', 'D.', 'Administrador', 'Altim', 'Altim', 'Portal Cloud');

-- ROLES
INSERT INTO master_roles (role_name) VALUES 
('Administrador'), 
('Cliente'), 
('Cliente_ADM'), 
('consultor'), 
('jefe de proyecto'), 
('Desarrollador'), 
('Management');

-- FASES
INSERT INTO master_fases (fase_name) VALUES 
('Discover'), 
('Prepare'), 
('Explore'), 
('Realize'), 
('Deploy'), 
('Run');

INSERT INTO master_jira_categories (category_name) VALUES ('Internal'), ('Client');
INSERT INTO master_project_types (type_name) VALUES ('Greenfield'), ('Brownfield'), ('Bluefield');

-- LOBS
INSERT INTO master_lobs (id_lob, id_idioma) VALUES 
('Ledger Scenarios', 'ES'), ('Application Platform and Infrastructure', 'ES'), ('BTP', 'ES'),
('Asset Management', 'ES'), ('Database and Data Management', 'ES'), ('Finance', 'ES'),
('Human Resources', 'ES'), ('IT Management', 'ES'), ('Manufacturing', 'ES'),
('No LoB Assignment', 'ES'), ('R&D / Engineering', 'ES'), ('Sales', 'ES'),
('Service', 'ES'), ('Solutions for Specific Industries', 'ES'), ('Sourcing and Procurement', 'ES'),
('Supply Chain', 'ES');

-- EXAMPLE CLIENTS
INSERT INTO clients (nombre_cliente, abrev, contacto, mail, tel) VALUES 
('Altim Trading SL', 'ALTRAD', 'Juan Pérez', 'jperez@altim.es', '+34 912 345 678'),
('Cervezas del Sur', 'CERVSUR', 'María Garcia', 'm.garcia@cervsur.com', '+34 954 000 111');

-- EXAMPLE PROJECT DATES FOR CALENDAR
UPDATE projects SET 
    fecha_inicio_pre = '2026-03-01', 
    fecha_fin_pre = '2026-03-31',
    nueva_fecha_fin_pre = '2026-04-10'
WHERE project_code = 'PRJ-001';

-- LOBS STARTER INFO
INSERT INTO lobs_starter_info (id_lob, url) VALUES 
('Finance', 'https://altim.sharepoint.com/sites/templates/FI'),
('Sales', 'https://altim.sharepoint.com/sites/templates/SD'),
('BTP', 'https://altim.sharepoint.com/sites/templates/BTP');

-- EXAMPLE BEST PRACTICES
INSERT INTO master_best_practice (id_lob, denominacion_bp, id_bp) VALUES 
('Finance', 'General Ledger Accounting', '1GA'),
('Finance', 'Accounts Payable', 'J60'),
('Sales', 'Sales Order Processing', 'BD9'),
('Sourcing and Procurement', 'Purchase Order Processing', 'BNX');

-- EXAMPLE UATS
INSERT INTO master_uats (id_lob, id_casop, id_bp, proceso_scope_item, escenario, actividades_proceso, precondiciones, pasos_detallados, datos_prueba, resultado_esperado, resultado_obtenido, estado_ok_nok, tipo_prueba, rol_perfil_responsable, raci) VALUES 
('Finance', 'TC-FI-001', '1GA', 'Contabilidad General', 'Registro de asiento manual', 'Creación de documento FB50', 'Usuario con acceso a FI', '1. Transacción FB50\n2. Introducir datos cabecera\n3. Introducir posiciones Debe/Haber', 'Sociedad 1000, Cuenta 600000', 'Documento contabilizado con éxito', 'OK', 'OK', 'Funcional', 'Consultor FI', 'R/A'),
('Sales', 'TC-SD-001', 'BD9', 'Ventas', 'Crear Pedido de Venta', 'Venta directa', 'Cliente creado en sistema', '1. Transacción VA01\n2. Introducir Cliente y Material', 'Material MAT-01, Cantidad 10', 'Pedido generado', 'Pendiente', 'OK', 'Integración', 'Key User Ventas', 'R');

-- EXAMPLE QUESTIONNAIRE
INSERT INTO master_questionnaire (lob_id, project_relevant, scope_ref, sap_id, area, topic, question, level, solution) VALUES 
('Finance', 'Yes', '1GA', 'SAP_FI_01', 'General Ledger', 'Chart of Accounts', 'Do you require local and group charts of accounts?', 'L1', 'Standard Best Practice 1GA'),
('Sales', 'Yes', 'BD9', 'SAP_SD_05', 'Sales', 'Pricing', 'Are your prices calculated based on volume or flat rate?', 'L2', 'Condition technique in SD');

-- EXAMPLE BPML
INSERT INTO master_bpml (bpml_id, id_e2e, negocio, grupo_proceso_l2, nombre_proceso_l3, id_bp, priority, sprint) VALUES 
('BPML-001', 'E2E-FIN', 'Finance', 'Record to Report', 'General Ledger Posting', '1GA', 'High', 'Sprint 1'),
('BPML-002', 'E2E-SD', 'Sales', 'Order to Cash', 'Sales Quotation', 'BD9', 'Medium', 'Sprint 2');
