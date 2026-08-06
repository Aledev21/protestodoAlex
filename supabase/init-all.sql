/*
# RPA/IA Process Management Schema (single-tenant)

## Overview
App for a Business Analyst managing "Frentes" (fronts), each containing "Processos" (processes),
each containing "AutomaÃ§Ãµes" (automations). Tracks the full lifecycle of an automation demand
from intake to delivery, with timeline, checklist, blockers, stakeholders, and dashboard metrics.

Single-tenant: no auth, no user_id. All data is shared. RLS enabled with anon+authenticated full CRUD.

## Tables
1. `frentes` â€” top-level work fronts (Emana Pay, Ã‚nima, Cresol, DASA...)
2. `clientes` â€” client organizations
3. `areas` â€” business areas
4. `stakeholders` â€” people involved (analyst, GP, SME, leadership, others)
5. `stakeholder_types` â€” enum-like lookup (analista, gp, cliente, sme, lideranca, outro)
6. `processos` â€” the core process entity with stage, status, priority, dates
7. `processo_stakeholders` â€” many-to-many linking people to a process with a role
8. `automacoes` â€” automations belonging to a process
9. `timeline_events` â€” append-only history per process and automation
10. `pendencias` â€” blockers / dependencies / doubts / waiting items per process
11. `checklist_items` â€” checklist per process and per automation
12. `comentarios` â€” comments on a process
13. `anexos` â€” attachments (url + name) on a process
14. `tags` â€” tag labels
15. `processo_tags` â€” m2m tags on processes
16. `dependencias` â€” dependencies between processes or automations

## Security
- RLS enabled on all tables.
- TO anon, authenticated with USING(true) / WITH CHECK(true) â€” intentionally shared single-user data.
*/

-- =============================================================
-- FRENTES
-- =============================================================
CREATE TABLE IF NOT EXISTS frentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE frentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_frentes" ON frentes;
CREATE POLICY "anon_crud_frentes" ON frentes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_frentes" ON frentes;
CREATE POLICY "anon_insert_frentes" ON frentes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_frentes" ON frentes;
CREATE POLICY "anon_update_frentes" ON frentes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_frentes" ON frentes;
CREATE POLICY "anon_delete_frentes" ON frentes FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- CLIENTES
-- =============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_clientes" ON clientes;
CREATE POLICY "anon_crud_clientes" ON clientes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clientes" ON clientes;
CREATE POLICY "anon_insert_clientes" ON clientes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clientes" ON clientes;
CREATE POLICY "anon_update_clientes" ON clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clientes" ON clientes;
CREATE POLICY "anon_delete_clientes" ON clientes FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- AREAS
-- =============================================================
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_areas" ON areas;
CREATE POLICY "anon_crud_areas" ON areas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_areas" ON areas;
CREATE POLICY "anon_insert_areas" ON areas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_areas" ON areas;
CREATE POLICY "anon_update_areas" ON areas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_areas" ON areas;
CREATE POLICY "anon_delete_areas" ON areas FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- STAKEHOLDERS
-- =============================================================
CREATE TABLE IF NOT EXISTS stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  tipo text NOT NULL DEFAULT 'outro', -- analista, gp, cliente, sme, lideranca, outro
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_stakeholders" ON stakeholders;
CREATE POLICY "anon_crud_stakeholders" ON stakeholders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_stakeholders" ON stakeholders;
CREATE POLICY "anon_insert_stakeholders" ON stakeholders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stakeholders" ON stakeholders;
CREATE POLICY "anon_update_stakeholders" ON stakeholders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stakeholders" ON stakeholders;
CREATE POLICY "anon_delete_stakeholders" ON stakeholders FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- PROCESSOS
-- =============================================================
CREATE TABLE IF NOT EXISTS processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frente_id uuid REFERENCES frentes(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  area_id uuid REFERENCES areas(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES stakeholders(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  objetivo text,
  escopo text,
  status text NOT NULL DEFAULT 'em_andamento', -- em_andamento, concluido, bloqueado, pausado
  etapa text NOT NULL DEFAULT 'coleta', -- see stage enum below
  prioridade text NOT NULL DEFAULT 'media', -- baixa, media, alta, critica
  data_criacao date DEFAULT CURRENT_DATE,
  data_prevista date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_processos" ON processos;
CREATE POLICY "anon_crud_processos" ON processos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_processos" ON processos;
CREATE POLICY "anon_insert_processos" ON processos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_processos" ON processos;
CREATE POLICY "anon_update_processos" ON processos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_processos" ON processos;
CREATE POLICY "anon_delete_processos" ON processos FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_processos_frente ON processos(frente_id);
CREATE INDEX IF NOT EXISTS idx_processos_status ON processos(status);
CREATE INDEX IF NOT EXISTS idx_processos_etapa ON processos(etapa);
CREATE INDEX IF NOT EXISTS idx_processos_responsavel ON processos(responsavel_id);

-- =============================================================
-- PROCESSO_STAKEHOLDERS (m2m)
-- =============================================================
CREATE TABLE IF NOT EXISTS processo_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  stakeholder_id uuid NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  papel text NOT NULL DEFAULT 'outro', -- analista, gp, cliente, sme, lideranca, outro
  created_at timestamptz DEFAULT now()
);
ALTER TABLE processo_stakeholders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "anon_crud_processo_stakeholders" ON processo_stakeholders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "anon_insert_processo_stakeholders" ON processo_stakeholders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "anon_update_processo_stakeholders" ON processo_stakeholders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "anon_delete_processo_stakeholders" ON processo_stakeholders FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- AUTOMACOES
-- =============================================================
CREATE TABLE IF NOT EXISTS automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  responsavel_id uuid REFERENCES stakeholders(id) ON DELETE SET NULL,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'Performer', -- Dispatcher, Performer, API, IA, etc
  status text NOT NULL DEFAULT 'nao_iniciado', -- nao_iniciado, em_andamento, concluido, bloqueado, pausado
  sprint text,
  documentacao text,
  progresso int DEFAULT 0, -- 0-100
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_automacoes" ON automacoes;
CREATE POLICY "anon_crud_automacoes" ON automacoes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_automacoes" ON automacoes;
CREATE POLICY "anon_insert_automacoes" ON automacoes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_automacoes" ON automacoes;
CREATE POLICY "anon_update_automacoes" ON automacoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_automacoes" ON automacoes;
CREATE POLICY "anon_delete_automacoes" ON automacoes FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_automacoes_processo ON automacoes(processo_id);

-- =============================================================
-- TIMELINE_EVENTS (append-only)
-- =============================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES processos(id) ON DELETE CASCADE,
  automacao_id uuid REFERENCES automacoes(id) ON DELETE CASCADE,
  data date DEFAULT CURRENT_DATE,
  titulo text NOT NULL,
  descricao text,
  tipo text DEFAULT 'evento', -- evento, etapa, pendencia, comentario, criacao
  created_at timestamptz DEFAULT now(),
  CHECK (processo_id IS NOT NULL OR automacao_id IS NOT NULL)
);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_timeline" ON timeline_events;
CREATE POLICY "anon_crud_timeline" ON timeline_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_timeline" ON timeline_events;
CREATE POLICY "anon_insert_timeline" ON timeline_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_timeline" ON timeline_events;
CREATE POLICY "anon_update_timeline" ON timeline_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_timeline" ON timeline_events;
CREATE POLICY "anon_delete_timeline" ON timeline_events FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_timeline_processo ON timeline_events(processo_id);
CREATE INDEX IF NOT EXISTS idx_timeline_automacao ON timeline_events(automacao_id);

-- =============================================================
-- PENDENCIAS
-- =============================================================
CREATE TABLE IF NOT EXISTS pendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES processos(id) ON DELETE CASCADE,
  automacao_id uuid REFERENCES automacoes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'pendencia', -- pendencia, bloqueio, dependencia, duvida, aguardando
  aguardando_quem text, -- cliente, sme, lideranca, gp, analista
  descricao text NOT NULL,
  resolvida boolean DEFAULT false,
  data_criacao date DEFAULT CURRENT_DATE,
  data_resolucao date,
  created_at timestamptz DEFAULT now(),
  CHECK (processo_id IS NOT NULL OR automacao_id IS NOT NULL)
);
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_pendencias" ON pendencias;
CREATE POLICY "anon_crud_pendencias" ON pendencias FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pendencias" ON pendencias;
CREATE POLICY "anon_insert_pendencias" ON pendencias FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pendencias" ON pendencias;
CREATE POLICY "anon_update_pendencias" ON pendencias FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pendencias" ON pendencias;
CREATE POLICY "anon_delete_pendencias" ON pendencias FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- CHECKLIST_ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES processos(id) ON DELETE CASCADE,
  automacao_id uuid REFERENCES automacoes(id) ON DELETE CASCADE,
  texto text NOT NULL,
  concluido boolean DEFAULT false,
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CHECK (processo_id IS NOT NULL OR automacao_id IS NOT NULL)
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_checklist" ON checklist_items;
CREATE POLICY "anon_crud_checklist" ON checklist_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklist" ON checklist_items;
CREATE POLICY "anon_insert_checklist" ON checklist_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklist" ON checklist_items;
CREATE POLICY "anon_update_checklist" ON checklist_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklist" ON checklist_items;
CREATE POLICY "anon_delete_checklist" ON checklist_items FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- COMENTARIOS
-- =============================================================
CREATE TABLE IF NOT EXISTS comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  autor text,
  texto text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_comentarios" ON comentarios;
CREATE POLICY "anon_crud_comentarios" ON comentarios FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comentarios" ON comentarios;
CREATE POLICY "anon_insert_comentarios" ON comentarios FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_comentarios" ON comentarios;
CREATE POLICY "anon_update_comentarios" ON comentarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comentarios" ON comentarios;
CREATE POLICY "anon_delete_comentarios" ON comentarios FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- ANEXOS
-- =============================================================
CREATE TABLE IF NOT EXISTS anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  url text NOT NULL,
  tipo text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_anexos" ON anexos;
CREATE POLICY "anon_crud_anexos" ON anexos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_anexos" ON anexos;
CREATE POLICY "anon_insert_anexos" ON anexos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_anexos" ON anexos;
CREATE POLICY "anon_update_anexos" ON anexos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_anexos" ON anexos;
CREATE POLICY "anon_delete_anexos" ON anexos FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- TAGS + PROCESSO_TAGS
-- =============================================================
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text DEFAULT '#64748b'
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_tags" ON tags;
CREATE POLICY "anon_crud_tags" ON tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tags" ON tags;
CREATE POLICY "anon_insert_tags" ON tags FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tags" ON tags;
CREATE POLICY "anon_update_tags" ON tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tags" ON tags;
CREATE POLICY "anon_delete_tags" ON tags FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS processo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
ALTER TABLE processo_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_processo_tags" ON processo_tags;
CREATE POLICY "anon_crud_processo_tags" ON processo_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_processo_tags" ON processo_tags;
CREATE POLICY "anon_insert_processo_tags" ON processo_tags FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_processo_tags" ON processo_tags;
CREATE POLICY "anon_update_processo_tags" ON processo_tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_processo_tags" ON processo_tags;
CREATE POLICY "anon_delete_processo_tags" ON processo_tags FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- DEPENDENCIAS (between processes or automations)
-- =============================================================
CREATE TABLE IF NOT EXISTS dependencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_tipo text NOT NULL, -- processo, automacao
  origem_id uuid NOT NULL,
  destino_tipo text NOT NULL, -- processo, automacao
  destino_id uuid NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dependencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_dependencias" ON dependencias;
CREATE POLICY "anon_crud_dependencias" ON dependencias FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dependencias" ON dependencias;
CREATE POLICY "anon_insert_dependencias" ON dependencias FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dependencias" ON dependencias;
CREATE POLICY "anon_update_dependencias" ON dependencias FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dependencias" ON dependencias;
CREATE POLICY "anon_delete_dependencias" ON dependencias FOR DELETE TO anon, authenticated USING (true);

-- =============================================================
-- updated_at trigger
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_processos_updated ON processos;
CREATE TRIGGER trg_processos_updated BEFORE UPDATE ON processos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_automacoes_updated ON automacoes;
CREATE TRIGGER trg_automacoes_updated BEFORE UPDATE ON automacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
/*
# Add arquivado column to automacoes

1. Modified Tables
- `automacoes`: added `arquivado` boolean column (defaults false) to support archiving automations
  without deleting them. Archived automations remain in the database with their timeline,
  checklist, and pendencia history intact, but can be hidden from the active list.
2. Security
- No policy changes needed â€” existing anon/authenticated CRUD policies already cover the new column.
*/

ALTER TABLE automacoes ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
/* Add arquivado column to frentes */
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
-- Add frente_id to areas, making them "Setores" scoped to a "Empresa" (frente)
ALTER TABLE areas ADD COLUMN IF NOT EXISTS frente_id uuid REFERENCES frentes(id) ON DELETE CASCADE;

-- Index for faster lookups by frente
CREATE INDEX IF NOT EXISTS idx_areas_frente ON areas(frente_id);

-- Drop the UNIQUE constraint on nome so different frentes can have setores with same name
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_nome_key;
