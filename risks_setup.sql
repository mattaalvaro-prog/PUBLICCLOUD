-- SQL Script for Risk Management
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS project_risks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES cliente_proy(id) ON DELETE CASCADE,
    riesgo_identificado TEXT NOT NULL,
    causa TEXT,
    probabilidad VARCHAR(50), -- e.g., Baja, Media, Alta
    impacto VARCHAR(50),      -- e.g., Bajo, Medio, Alto
    prioridad INTEGER DEFAULT 0,
    estrategia_respuesta TEXT,
    plan_respuesta TEXT,
    estado VARCHAR(50) DEFAULT 'Abierto', -- Abierto, En Mitigación, Cerrado
    comentarios TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
