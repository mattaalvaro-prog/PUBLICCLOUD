-- ========================================================
-- QUALITY GATES SETUP (SUPABASE / POSTGRESQL)
-- 1. Tabla: project_quality_gates (QG - Quality Gates / Title PROY)
-- 2. Tabla: project_qr_operaciones (QR - Quality Gate Operaciones / Title GES)
-- ========================================================

-- --------------------------------------------------------
-- 1. TABLA: QG - QUALITY GATES (PROYECTO)
-- Cuestionario de calidad por fases de SAP Activate
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_quality_gates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES cliente_proy(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,            -- Ej: 'QG-DIS-01', 'QG-PRE-01', 'QG-REA-04'
    fase VARCHAR(50) NOT NULL,              -- 'Discover', 'Preparar', 'Explorar', 'Realizar', 'Desplegar', 'Ejecutar'
    area VARCHAR(150),                     -- Área o requisito (Alcance, Planificación, BPML, UAT, etc.)
    pregunta TEXT NOT NULL,                -- Pregunta o criterio de calidad a validar
    estado VARCHAR(50) DEFAULT 'Pendiente', -- 'Cumple', 'En Proceso', 'Pendiente', 'No Cumple'
    evidencia TEXT,                        -- Enlace a documento, acta o justificación
    comentarios TEXT,                      -- Comentarios adicionales o notas de seguimiento
    fecha_validacion DATE,                 -- Fecha en que se validó el criterio
    responsable VARCHAR(150),              -- Responsable de la validación
    orden INTEGER DEFAULT 0,               -- Orden visual dentro de la fase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_qg_project_code UNIQUE(project_id, codigo)
);

-- Comentarios descriptivos de columnas
COMMENT ON TABLE project_quality_gates IS 'Quality Gates de Proyecto agrupados por fase y proyecto (Title PROY - Parte 4)';
COMMENT ON COLUMN project_quality_gates.project_id IS 'Clave foránea hacia cliente_proy(id)';
COMMENT ON COLUMN project_quality_gates.codigo IS 'Identificador de la pregunta (ej. QG-DIS-01, QG-PRE-02)';
COMMENT ON COLUMN project_quality_gates.fase IS 'Fase de la metodología SAP Activate';

-- Índices para optimizar consultas y filtros por proyecto y fase
CREATE INDEX IF NOT EXISTS idx_qg_project_id ON project_quality_gates(project_id);
CREATE INDEX IF NOT EXISTS idx_qg_fase ON project_quality_gates(fase);
CREATE INDEX IF NOT EXISTS idx_qg_estado ON project_quality_gates(estado);


-- --------------------------------------------------------
-- 2. TABLA: QR - QUALITY GATE OPERACIONES
-- Criterios y checklist de pase a operaciones y soporte AMS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_qr_operaciones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES cliente_proy(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,            -- Ej: 'QR-PRE-01', 'QR-EXP-02', 'QR-REA-01'
    fase VARCHAR(50) NOT NULL,              -- 'Preparar', 'Explorar', 'Realizar', 'Desplegar', 'Ejecutar', 'Discover'
    area VARCHAR(150),                     -- Dominio u objetivo (Gobernanza, SLAs, Soporte AMS, etc.)
    pregunta TEXT NOT NULL,                -- Criterio o pregunta de calidad operativa
    estado VARCHAR(50) DEFAULT 'Pendiente', -- 'Cumple', 'En Proceso', 'Pendiente', 'No Cumple'
    evidencia TEXT,                        -- Enlace a acuerdo operativo, acta de entrega u observaciones
    comentarios TEXT,                      -- Comentarios adicionales o notas operativas
    fecha_validacion DATE,                 -- Fecha de validación operativa
    responsable VARCHAR(150),              -- Responsable (Service Manager, Lead BASIS, etc.)
    orden INTEGER DEFAULT 0,               -- Orden visual dentro de la fase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_qr_project_code UNIQUE(project_id, codigo)
);

-- Comentarios descriptivos de columnas
COMMENT ON TABLE project_qr_operaciones IS 'Quality Gates de Operaciones y Traspaso AMS agrupados por fase (Title GES - Parte 2)';
COMMENT ON COLUMN project_qr_operaciones.project_id IS 'Clave foránea hacia cliente_proy(id)';
COMMENT ON COLUMN project_qr_operaciones.codigo IS 'Identificador del criterio operativo (ej. QR-PRE-01, QR-REA-03)';
COMMENT ON COLUMN project_qr_operaciones.fase IS 'Fase operativa del proyecto';

-- Índices para optimizar consultas y filtros por proyecto y fase
CREATE INDEX IF NOT EXISTS idx_qr_project_id ON project_qr_operaciones(project_id);
CREATE INDEX IF NOT EXISTS idx_qr_fase ON project_qr_operaciones(fase);
CREATE INDEX IF NOT EXISTS idx_qr_estado ON project_qr_operaciones(estado);


-- --------------------------------------------------------
-- 3. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Permite lectura y escritura a los usuarios de Supabase
-- --------------------------------------------------------
ALTER TABLE project_quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_qr_operaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_quality_gates' AND policyname = 'Permitir todo en project_quality_gates'
    ) THEN
        CREATE POLICY "Permitir todo en project_quality_gates" ON project_quality_gates
        FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_qr_operaciones' AND policyname = 'Permitir todo en project_qr_operaciones'
    ) THEN
        CREATE POLICY "Permitir todo en project_qr_operaciones" ON project_qr_operaciones
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
