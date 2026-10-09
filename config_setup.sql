-- --------------------------------------------------------
-- SYSTEM CONFIGURATION SETUP
-- --------------------------------------------------------

-- 1. Tabla de Configuración del Sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_value TEXT,
    description TEXT,
    category VARCHAR(50), -- e.g., 'API_KEYS', 'ENDPOINTS', 'EMAIL'
    is_secret BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- 2. Inserción de claves base por defecto (Tokens vacíos para llenar desde la UI)
INSERT INTO system_config (key_name, key_value, description, category, is_secret) VALUES 
('GOOGLE_GEMINI_API_KEY', '', 'Token de acceso para la Inteligencia Artificial Gemini', 'API_KEYS', TRUE),
('SHAREPOINT_CLIENT_ID', '', 'Client ID para integraciones con repositorios SharePoint', 'API_KEYS', TRUE),
('SHAREPOINT_CLIENT_SECRET', '', 'Secret Key de la aplicación Azure AD para SharePoint', 'API_KEYS', TRUE),
('SHAREPOINT_TENANT_ID', '', 'ID del Tenant de Microsoft 365', 'ENDPOINTS', FALSE),
('JIRA_API_TOKEN', '', 'Token de autenticación Bearer para Atlassian Jira', 'API_KEYS', TRUE),
('JIRA_BASE_URL', 'https://altim.atlassian.net', 'URL base del endpoint de Jira', 'ENDPOINTS', FALSE),
('JIRA_USER_EMAIL', '', 'Email de la cuenta de servicio de Jira', 'EMAIL', FALSE),
('EXCHANGE_CLIENT_ID', '', 'Client ID para integraciones con MS Exchange / Outlook', 'API_KEYS', TRUE),
('EXCHANGE_CLIENT_SECRET', '', 'Secret Key para integraciones con MS Exchange / Outlook', 'API_KEYS', TRUE),
('EMAILJS_PUBLIC_KEY', '', 'Public Key de la cuenta de EmailJS para notificaciones', 'API_KEYS', FALSE),
('EMAILJS_SERVICE_ID', '', 'ID del Servicio de correo para EmailJS', 'ENDPOINTS', FALSE),
('EMAILJS_TEMPLATE_ID', '', 'ID de la plantilla predeterminada para notificaciones en EmailJS', 'ENDPOINTS', FALSE)
ON CONFLICT (key_name) DO NOTHING;

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_sysconf_category ON system_config(category);

-- NOTA IMPORTANTE PARA SEGURIDAD:
-- Recomiendo activar Row Level Security (RLS) en Supabase para evitar que usuarios comunes extraigan estos tokens:
-- ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admins ONLY" ON system_config FOR ALL USING (auth.jwt() ->> 'role' = 'Administrador');
