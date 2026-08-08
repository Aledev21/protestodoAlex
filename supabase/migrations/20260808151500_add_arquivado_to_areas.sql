/*
# Add arquivado column to areas (setores)

1. Modified Tables
- `areas`: added `arquivado` boolean column (defaults false) to support archiving
  setores the same way frentes/processos/automacoes already do.
2. Indexes
- `idx_areas_arquivado` to speed up filtering by archived state.
3. Security
- No policy changes needed - existing `auth_all_areas` policy already covers the new column.
*/

ALTER TABLE areas ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_areas_arquivado ON areas(arquivado);
