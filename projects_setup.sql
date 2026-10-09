-- SQL Script to create the Projects table separately
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS cliente_proy CASCADE;

CREATE TABLE cliente_proy (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    id_proyecto VARCHAR(30) UNIQUE NOT NULL,
    descripcion_prj VARCHAR(40),
    sharepoint_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert example projects for existing clients
-- (Ensure you have clients in the 'clients' table first)
/*
INSERT INTO cliente_proy (client_id, id_proyecto, descripcion_prj) 
VALUES 
((SELECT id FROM clients WHERE abrev = 'ALTRAD' LIMIT 1), 'PRJ-SAP-001', 'Migración SAP S/4HANA'),
((SELECT id FROM clients WHERE abrev = 'CERVSUR' LIMIT 1), 'PRJ-LOG-002', 'Optimización Logística');
*/
