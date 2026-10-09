-- SQL Script for PROJECT INFORMATION (PROY)
-- Run this in your Supabase SQL Editor

-- 1. Update Projects table with additional dates
ALTER TABLE cliente_proy 
ADD COLUMN IF NOT EXISTS go_live_date DATE,
ADD COLUMN IF NOT EXISTS support_start_date DATE,
ADD COLUMN IF NOT EXISTS support_end_date DATE;

-- 2. Create Project Phases table
DROP TABLE IF EXISTS project_phases CASCADE;

CREATE TABLE project_phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES cliente_proy(id) ON DELETE CASCADE,
    phase_name VARCHAR(50) NOT NULL, -- Discover, Prepare, Explore, Realize, Deploy, Execute
    start_date DATE,
    end_date DATE,
    new_start_date DATE,
    new_end_date DATE,
    progress INTEGER DEFAULT 0, -- 0 to 100
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, phase_name)
);

-- Note: The application logic will handle creating the 6 rows automatically 
-- when a project is selected if they don't exist.
