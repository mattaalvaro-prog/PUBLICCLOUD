-- SQL Script for the new "Documentos" table
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS documentos CASCADE;

CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(100),         -- Nombre o Abrev del Cliente
    proyecto VARCHAR(50),          -- ID del Proyecto (id_proyecto)
    id_fase VARCHAR(20),           -- DES, PRE, EXP, REA, DEPLOY, EJE, GES
    tipo_documento VARCHAR(100),   -- Categoría (Oferta, Acta, etc.)
    numerador VARCHAR(20),         -- Secuencial 15 dígitos (Fase + Autonum)
    url TEXT,                      -- Link a SharePoint
    id_lob VARCHAR(50),            -- Line of Business (opcional)
    nombre_taller VARCHAR(100),    -- Nombre del Taller (opcional)
    fecha DATE DEFAULT CURRENT_DATE, -- Fecha de registro
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster filtering by project and phase
CREATE INDEX idx_docs_project ON documentos(proyecto);
CREATE INDEX idx_docs_phase ON documentos(id_fase);
