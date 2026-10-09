-- Table for Public News and Links in the Dashboard
CREATE TABLE IF NOT EXISTS public_news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    order_priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO public_news (title, description, url, image_url) VALUES 
('Portal de Ayuda SAP', 'Documentación oficial y guías de usuario para S/4HANA Cloud.', 'https://help.sap.com', 'https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg'),
('ALTIM - Innovación Digital', 'Últimas noticias y casos de éxito en nuestra web corporativa.', 'https://www.altim.es', 'https://www.altim.es/wp-content/uploads/2021/05/logo-altim-pie.png'),
('SAP Fiori Design Guidelines', 'Mejores prácticas para la interfaz de usuario.', 'https://experience.sap.com/fiori-design/', 'https://experience.sap.com/fiori-design/wp-content/uploads/sites/5/2017/02/Fiori-Design-Guidelines-Logo.png')
ON CONFLICT DO NOTHING;
