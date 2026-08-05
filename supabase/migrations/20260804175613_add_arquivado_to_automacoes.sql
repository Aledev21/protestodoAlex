/*
# Add arquivado column to automacoes

1. Modified Tables
- `automacoes`: added `arquivado` boolean column (defaults false) to support archiving automations
  without deleting them. Archived automations remain in the database with their timeline,
  checklist, and pendencia history intact, but can be hidden from the active list.
2. Security
- No policy changes needed — existing anon/authenticated CRUD policies already cover the new column.
*/

ALTER TABLE automacoes ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
