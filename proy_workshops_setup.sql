-- SQL Script for WORKSHOPS MANAGEMENT
-- Run this in your Supabase SQL Editor

-- 1. Create Workshops Scheduled table
DROP TABLE IF EXISTS project_workshops CASCADE;

CREATE TABLE project_workshops (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES cliente_proy(id) ON DELETE CASCADE,
    group_id VARCHAR(50) NOT NULL,
    group_name VARCHAR(255),
    scheduled_date DATE NOT NULL,
    color_idx INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Workshop Groups table (to store which BPs are in which group)
DROP TABLE IF EXISTS workshop_groups CASCADE;

CREATE TABLE workshop_groups (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES cliente_proy(id) ON DELETE CASCADE,
    group_id VARCHAR(50) NOT NULL,
    group_name VARCHAR(255),
    id_lob VARCHAR(50), -- NEW: Link to master_lobs
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, group_id)
);

-- 3. Junction table for BPs in Groups
DROP TABLE IF EXISTS workshop_group_items CASCADE;

CREATE TABLE workshop_group_items (
    id SERIAL PRIMARY KEY,
    group_record_id INTEGER REFERENCES workshop_groups(id) ON DELETE CASCADE,
    bp_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
