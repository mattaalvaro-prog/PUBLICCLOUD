-- ==============================================================================
-- MIGRACIÓN: AÑADIR CAMPO 'comentarios' A QUALITY GATES (PROYECTO Y OPERACIONES)
-- Tablas: project_quality_gates y project_qr_operaciones
-- ==============================================================================

-- 1. Añadir columna 'comentarios' en project_quality_gates (Title PROY - QG Quality Gates)
ALTER TABLE project_quality_gates 
ADD COLUMN IF NOT EXISTS comentarios TEXT;

COMMENT ON COLUMN project_quality_gates.comentarios IS 'Comentarios adicionales, notas de seguimiento o acuerdos de los Quality Gates';

-- 2. Añadir columna 'comentarios' en project_qr_operaciones (Title GES - QR Quality Gate Operaciones)
ALTER TABLE project_qr_operaciones 
ADD COLUMN IF NOT EXISTS comentarios TEXT;

COMMENT ON COLUMN project_qr_operaciones.comentarios IS 'Comentarios adicionales, acuerdos de servicio o notas operativas del criterio';

-- Comprobación informativa
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('project_quality_gates', 'project_qr_operaciones') 
  AND column_name = 'comentarios';
