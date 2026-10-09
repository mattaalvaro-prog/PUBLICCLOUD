-- --------------------------------------------------------
-- ALTIM PORTAL CLOUD - NEW TABLE: General_questionarie
-- --------------------------------------------------------

-- Aseguramos que existe una restricción única compuesta en master_lobs para poder referenciar ambos campos a la vez
ALTER TABLE master_lobs DROP CONSTRAINT IF EXISTS master_lobs_id_lob_id_idioma_key;
ALTER TABLE master_lobs ADD CONSTRAINT master_lobs_id_lob_id_idioma_key UNIQUE (id_lob, id_idioma);

-- Eliminamos la tabla si ya existe para poder recrearla
DROP TABLE IF EXISTS "General_questionarie" CASCADE;

-- Creación de la nueva tabla
CREATE TABLE "General_questionarie" (
    "ID_Cuestionario" SERIAL PRIMARY KEY,
    "Area" VARCHAR(150),
    "id_lob" VARCHAR(50),
    "PREGUNTA" TEXT,
    "Descripcion" TEXT,
    "Id_idioma" VARCHAR(10),
    
    -- El campo id_lob y el id_idioma deben coincidir con los de la tabla master_lobs
    CONSTRAINT fk_lob_idioma FOREIGN KEY ("id_lob", "Id_idioma") 
        REFERENCES master_lobs ("id_lob", "id_idioma")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Nota: Si ID_Cuestionario debe ser un texto (varchar) en lugar de auto-incremental (SERIAL), 
-- se puede cambiar a VARCHAR(50) PRIMARY KEY.
