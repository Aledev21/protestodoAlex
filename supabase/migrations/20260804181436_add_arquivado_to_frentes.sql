/* Add arquivado column to frentes */
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
