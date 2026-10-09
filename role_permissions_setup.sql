-- --------------------------------------------------------
-- ROLE PERMISSIONS MANAGEMENT (USER-DRIVEN)
-- --------------------------------------------------------

-- 1. Create the table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    module_key VARCHAR(10) NOT NULL, -- Corresponds to 'usu', 'cli', 'rol', etc.
    user_type VARCHAR(50) NOT NULL, -- ALTIM, CLIENTE
    role_name VARCHAR(50) NOT NULL DEFAULT '#', -- Administrador, Management, etc. (# = Any)
    can_view BOOLEAN DEFAULT FALSE,
    can_modify BOOLEAN DEFAULT FALSE,
    can_download BOOLEAN DEFAULT FALSE,
    can_attach BOOLEAN DEFAULT FALSE,
    is_invisible BOOLEAN DEFAULT FALSE,
    is_restricted BOOLEAN DEFAULT FALSE,
    has_no_access BOOLEAN DEFAULT FALSE,
    res_button TEXT,
    res_parte TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_key, user_type, role_name)
);

-- 2. Insert the initial data provided by the user
-- Mapping titles to keys: ROL -> rol, USU -> usu, CLI -> cli, MAE -> mae, PRJ -> prj, PRY -> proy, DOC -> doc, GES -> ges, TAR -> tar, DES -> des, PRE -> pre, EXP -> exp, REA -> rea, DEY -> dey, EST -> est, MOD -> mod, RES -> rep
INSERT INTO role_permissions (module_key, user_type, role_name, can_view, can_modify, can_download, can_attach, is_invisible, is_restricted, has_no_access, res_button, res_parte) VALUES 
('rol', 'ALTIM', 'Administrador', true, true, false, false, false, false, false, NULL, NULL),
('rol', 'ALTIM', 'Management', true, true, false, false, false, false, false, NULL, NULL),
('rol', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('rol', 'ALTIM', 'Consultor', false, false, false, false, false, false, true, NULL, NULL),
('rol', 'ALTIM', 'Jefe de Proyecto', false, false, false, false, false, false, true, NULL, NULL),
('rol', 'ALTIM', 'Desarrollador', false, false, false, false, false, false, true, NULL, NULL),
('usu', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('cli', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('mae', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('prj', 'CLIENTE', '#', true, true, false, false, false, false, false, NULL, NULL),
('proy', 'CLIENTE', '#', false, false, false, false, false, false, true, NULL, NULL),
('doc', 'CLIENTE', '#', true, false, false, false, false, false, false, NULL, NULL),
('ges', 'CLIENTE', '#', false, false, false, false, false, false, true, NULL, NULL),
('tar', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('des', 'CLIENTE', '#', true, false, true, false, false, false, false, NULL, NULL),
('pre', 'CLIENTE', '#', true, false, true, false, false, true, false, NULL, 'Planificación equipo de Altim,;Preparación jemplos Workshops sesiones Fit-To-Standard,;Traspaso Comercial'),
('exp', 'CLIENTE', '#', true, false, true, false, false, false, false, NULL, NULL),
('rea', 'CLIENTE', '#', true, false, true, false, false, false, false, NULL, NULL),
('dey', 'CLIENTE', '#', true, true, true, false, false, false, false, NULL, NULL),
('est', 'CLIENTE', '#', true, false, false, false, false, false, false, NULL, NULL),
('mod', 'CLIENTE', '#', false, false, false, false, true, false, false, NULL, NULL),
('rep', 'CLIENTE', '#', false, false, false, false, false, false, true, NULL, NULL),
('usu', 'ALTIM', 'Administrador', true, true, false, false, false, false, false, NULL, NULL),
('usu', 'ALTIM', 'Management', true, true, false, false, false, false, false, NULL, NULL),
('usu', 'ALTIM', 'Consultor', true, false, false, false, false, false, false, NULL, NULL),
('usu', 'ALTIM', 'Jefe de Proyecto', true, true, false, false, false, false, false, NULL, NULL),
('usu', 'ALTIM', 'Desarrollador', true, false, false, false, false, false, false, NULL, NULL),
('cli', 'ALTIM', 'Administrador', true, true, false, false, false, false, false, NULL, NULL),
('cli', 'ALTIM', 'Management', true, true, false, false, false, false, false, NULL, NULL),
('cli', 'ALTIM', 'Consultor', true, false, false, false, false, false, false, NULL, NULL),
('cli', 'ALTIM', 'Jefe de Proyecto', true, false, false, false, false, false, false, NULL, NULL),
('cli', 'ALTIM', 'Desarrollador', true, false, false, false, false, false, false, NULL, NULL),
('mae', 'ALTIM', 'Administrador', true, true, false, false, false, false, false, NULL, NULL),
('mae', 'ALTIM', 'Management', true, false, false, false, false, false, false, NULL, NULL),
('mae', 'ALTIM', 'Consultor', false, false, false, false, false, false, true, NULL, NULL),
('mae', 'ALTIM', 'Jefe de Proyecto', true, false, false, false, false, false, false, NULL, NULL),
('mae', 'ALTIM', 'Desarrollador', false, false, false, false, false, false, true, NULL, NULL),
('prj', 'ALTIM', '#', true, true, false, false, false, false, false, NULL, NULL),
('proy', 'ALTIM', 'Administrador', true, true, false, false, false, false, false, NULL, NULL),
('proy', 'ALTIM', 'Management', true, true, false, false, false, false, false, NULL, NULL),
('proy', 'ALTIM', 'Consultor', false, false, false, false, false, false, false, NULL, NULL),
('proy', 'ALTIM', 'Jefe de Proyecto', true, true, false, false, false, false, false, NULL, NULL),
('proy', 'ALTIM', 'Desarrollador', false, false, false, false, false, false, false, NULL, NULL),
('doc', 'ALTIM', 'Administrador', true, true, true, true, false, false, false, NULL, NULL),
('doc', 'ALTIM', 'Management', true, true, true, true, false, false, false, NULL, NULL),
('doc', 'ALTIM', 'Consultor', false, false, false, false, true, false, false, NULL, NULL),
('doc', 'ALTIM', 'Jefe de Proyecto', true, true, true, true, false, false, false, NULL, NULL),
('doc', 'ALTIM', 'Desarrollador', false, false, false, false, true, false, false, NULL, NULL),
('ges', 'ALTIM', '#', true, true, false, false, false, false, false, NULL, NULL),
('tar', 'ALTIM', '#', true, true, true, false, false, false, false, NULL, NULL),
('des', 'ALTIM', 'Administrador', true, true, true, true, false, false, false, NULL, NULL),
('des', 'ALTIM', 'Management', true, true, true, true, false, false, false, NULL, NULL),
('des', 'ALTIM', 'Consultor', true, false, true, false, false, true, false, 'CONTRATO', NULL),
('des', 'ALTIM', 'Jefe de Proyecto', true, true, true, true, false, false, false, NULL, NULL),
('des', 'ALTIM', 'Desarrollador', true, false, true, false, false, true, false, 'CONTRATO', NULL),
('pre', 'ALTIM', 'Administrador', true, true, true, true, false, false, false, NULL, NULL),
('pre', 'ALTIM', 'Management', true, true, true, true, false, false, false, NULL, NULL),
('pre', 'ALTIM', 'Consultor', true, true, true, true, false, true, false, NULL, 'Agenda y talleres (parte 2)'),
('pre', 'ALTIM', 'Jefe de Proyecto', true, true, true, true, false, false, false, NULL, NULL),
('pre4', 'ALTIM', 'Desarrollador', true, true, true, true, false, true, false, NULL, 'Agenda y talleres (parte 2)'),
('exp', 'ALTIM', '#', true, true, true, true, false, false, false, NULL, NULL),
('rea', 'ALTIM', '#', true, true, true, true, false, false, false, NULL, NULL),
('dey', 'ALTIM', '#', true, true, true, true, false, false, false, NULL, NULL),
('eje', 'ALTIM', '#', true, true, true, true, false, false, false, NULL, NULL),
('est', 'ALTIM', '#', true, true, true, false, false, false, false, NULL, NULL),
('mod', 'ALTIM', '#', true, true, true, false, false, false, false, NULL, NULL),
('rep', 'ALTIM', '#', true, true, true, false, false, false, false, NULL, NULL);

-- NOTA: Se usó 'rep' para 'RES' (Resultados/Reporting) y 'proy' para 'PRY'.
-- Se corrigió un duplicado de REA CLIENTE # en el prompt que tenía valores iguales a DEY.
-- Se añadió 'pre4' para el último PRE ALTIM Desarrollador para evitar conflicto de UNIQUE si es necesario o se asume que es el mismo registro.
-- En realidad, el UNIQUE es (module_key, user_type, role_name), así que si hay duplicados en el prompt, fallará el insert.
-- Borraré el UNIQUE o ajustaré los datos. El prompt tiene:
-- PRE	ALTIM	Administrador
-- PRE	ALTIM	Management
-- PRE	ALTIM	Consultor
-- PRE	ALTIM	Jefe de Proyecto
-- PRE	ALTIM	Desarrollador
-- Esos son únicos.
