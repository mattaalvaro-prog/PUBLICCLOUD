-- --------------------------------------------------------
-- USER-PROJECT ASSIGNMENTS (N:M RELATIONSHIP)
-- --------------------------------------------------------

-- This table links users to specific projects within the 'cliente_proy' table.
-- Since 'cliente_proy' is already linked to 'clients', this effectively
-- links users to both the project and its parent client.

CREATE TABLE IF NOT EXISTS user_project_relation (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES cliente_proy(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, project_id)
);

-- Table for multi-client assignment (mainly for ALTIM users)
CREATE TABLE IF NOT EXISTS user_client_relation (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, client_id)
);

-- OPTIONAL: View to easily see user assignments with client names
-- DROP VIEW first to avoid "cannot change data type" errors
DROP VIEW IF EXISTS view_user_assignments;
CREATE OR REPLACE VIEW view_user_assignments AS
SELECT 
    u.id as user_id,
    u.email as user_email,
    c.id as client_id,
    c.nombre_cliente as client_name,
    p.id as project_id,
    p.id_proyecto as project_code,
    p.descripcion_prj as project_name,
    'Project' as assignment_type
FROM users u
JOIN user_project_relation up ON u.id = up.user_id
JOIN cliente_proy p ON up.project_id = p.id
JOIN clients c ON p.client_id = c.id
UNION ALL
SELECT 
    u.id as user_id,
    u.email as user_email,
    c.id as client_id,
    c.nombre_cliente as client_name,
    NULL::integer as project_id,
    NULL::varchar as project_code,
    'ALL PROJECTS' as project_name,
    'Client' as assignment_type
FROM users u
JOIN user_client_relation uc ON u.id = uc.user_id
JOIN clients c ON uc.client_id = c.id;

-- Note: Ensure 'cliente_proy' and 'users' tables exist before running this.
