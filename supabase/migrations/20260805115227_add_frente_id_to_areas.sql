-- Add frente_id to areas, making them "Setores" scoped to a "Empresa" (frente)
ALTER TABLE areas ADD COLUMN IF NOT EXISTS frente_id uuid REFERENCES frentes(id) ON DELETE CASCADE;

-- Index for faster lookups by frente
CREATE INDEX IF NOT EXISTS idx_areas_frente ON areas(frente_id);

-- Drop the UNIQUE constraint on nome so different frentes can have setores with same name
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_nome_key;
