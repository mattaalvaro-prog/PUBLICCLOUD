-- 1. Tabla de Incidencias
CREATE TABLE IF NOT EXISTS incidencias (
    id SERIAL PRIMARY KEY,
    numero_incidencia VARCHAR(20) UNIQUE NOT NULL, -- Ej: ALT0000001
    cliente_id INTEGER REFERENCES clients(id),
    proyecto_id INTEGER REFERENCES projects(id),
    fecha_incid DATE DEFAULT CURRENT_DATE,
    resp_cliente VARCHAR(100),
    tipo VARCHAR(50), -- Consulta, Duda, Evolutivo, Formación, Gestión, Incidencia, Petición, Preventiva, Proyecto
    tipo_altim VARCHAR(50),
    lob VARCHAR(100), -- Línea de Negocio (Finanzas, Ventas, etc.)
    descripcion TEXT,
    error_mensaje TEXT,
    observaciones TEXT,
    prioridad VARCHAR(20), -- Alta, Baja, Crítica, Media, Sin prioridad
    comentarios TEXT,
    sistema VARCHAR(100), -- S/4Hana CP, Rise, OP, etc.
    resp_altim VARCHAR(100),
    estado VARCHAR(50), -- 01 En proceso, ... 10 Cerrada, etc.
    fecha_entrega DATE,
    fecha_cierre DATE,
    comentarios_finales TEXT,
    responsable VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Auditoría de Incidencias
CREATE TABLE IF NOT EXISTS incident_audit_logs (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES incidencias(id) ON DELETE CASCADE,
    usuario_email VARCHAR(255),
    accion VARCHAR(100), -- Creación, Modificación, Cambio Estado
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incidencias_cliente ON incidencias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_proyecto ON incidencias(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_audit_incident ON incident_audit_logs(incident_id);

-- 4. Función para autogenerar número de incidencia por cliente
-- Esto se puede implementar también en app.js, pero un trigger es más robusto.
-- Si prefieres manejarlo desde el frontend (como estaba en la app original), dímelo.
