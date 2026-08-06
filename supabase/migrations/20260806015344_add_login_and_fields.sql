/*
# Auth, novos campos em processos, e remoção de data_prevista

## Visão geral
1. Adiciona campos ao `processos`: `sme`, `caminho_anexo`, `volumetria`, `saving`, `arquivado`.
2. Remove `data_prevista` (substituído por controle de prazo dentro de timeline/pendencias).
3. Tighten RLS: remove políticas `anon`; mantém apenas `authenticated` (login obrigatório).

## Segurança
- Após rodar essa migration, o app EXIGE login. Sem sessão válida, nenhuma leitura/escrita é permitida.
- Crie o primeiro usuário em: Supabase Dashboard → Authentication → Users → Add user.
- Para desenvolvimento local, você pode desabilitar confirmação de email: Authentication → Providers → Email → desmarcar "Confirm email".

## Campos removidos
- `processos.data_prevista` — use o controle de prazo via `pendencias` ou `timeline_events`.
*/

-- =============================================================
-- NOVOS CAMPOS EM PROCESSOS
-- =============================================================

ALTER TABLE processos ADD COLUMN IF NOT EXISTS sme uuid REFERENCES stakeholders(id) ON DELETE SET NULL;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS caminho_anexo text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS volumetria text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS saving text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_processos_sme ON processos(sme);
CREATE INDEX IF NOT EXISTS idx_processos_arquivado ON processos(arquivado);

-- =============================================================
-- REMOVE DATA_PREVISTA
-- =============================================================

ALTER TABLE processos DROP COLUMN IF EXISTS data_prevista;

-- =============================================================
-- TIGHTEN RLS — APENAS authenticated
-- =============================================================
-- Remove todas as policies antigas (cobria anon + authenticated)
-- e recria permitindo APENAS authenticated.
-- Após essa mudança, sem login o app fica sem acesso aos dados.

-- FRENTES
DROP POLICY IF EXISTS "anon_crud_frentes" ON frentes;
DROP POLICY IF EXISTS "anon_insert_frentes" ON frentes;
DROP POLICY IF EXISTS "anon_update_frentes" ON frentes;
DROP POLICY IF EXISTS "anon_delete_frentes" ON frentes;
DROP POLICY IF EXISTS "auth_all_frentes" ON frentes;
CREATE POLICY "auth_all_frentes" ON frentes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CLIENTES
DROP POLICY IF EXISTS "anon_crud_clientes" ON clientes;
DROP POLICY IF EXISTS "anon_insert_clientes" ON clientes;
DROP POLICY IF EXISTS "anon_update_clientes" ON clientes;
DROP POLICY IF EXISTS "anon_delete_clientes" ON clientes;
DROP POLICY IF EXISTS "auth_all_clientes" ON clientes;
CREATE POLICY "auth_all_clientes" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AREAS
DROP POLICY IF EXISTS "anon_crud_areas" ON areas;
DROP POLICY IF EXISTS "anon_insert_areas" ON areas;
DROP POLICY IF EXISTS "anon_update_areas" ON areas;
DROP POLICY IF EXISTS "anon_delete_areas" ON areas;
DROP POLICY IF EXISTS "auth_all_areas" ON areas;
CREATE POLICY "auth_all_areas" ON areas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STAKEHOLDERS
DROP POLICY IF EXISTS "anon_crud_stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "anon_insert_stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "anon_update_stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "anon_delete_stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "auth_all_stakeholders" ON stakeholders;
CREATE POLICY "auth_all_stakeholders" ON stakeholders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROCESSOS
DROP POLICY IF EXISTS "anon_crud_processos" ON processos;
DROP POLICY IF EXISTS "anon_insert_processos" ON processos;
DROP POLICY IF EXISTS "anon_update_processos" ON processos;
DROP POLICY IF EXISTS "anon_delete_processos" ON processos;
DROP POLICY IF EXISTS "auth_all_processos" ON processos;
CREATE POLICY "auth_all_processos" ON processos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROCESSO_STAKEHOLDERS
DROP POLICY IF EXISTS "anon_crud_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "anon_insert_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "anon_update_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "anon_delete_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "auth_all_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "auth_all_processo_stakeholders" ON processo_stakeholders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AUTOMACOES
DROP POLICY IF EXISTS "anon_crud_automacoes" ON automacoes;
DROP POLICY IF EXISTS "anon_insert_automacoes" ON automacoes;
DROP POLICY IF EXISTS "anon_update_automacoes" ON automacoes;
DROP POLICY IF EXISTS "anon_delete_automacoes" ON automacoes;
DROP POLICY IF EXISTS "auth_all_automacoes" ON automacoes;
CREATE POLICY "auth_all_automacoes" ON automacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TIMELINE_EVENTS
DROP POLICY IF EXISTS "anon_crud_timeline" ON timeline_events;
DROP POLICY IF EXISTS "anon_insert_timeline" ON timeline_events;
DROP POLICY IF EXISTS "anon_update_timeline" ON timeline_events;
DROP POLICY IF EXISTS "anon_delete_timeline" ON timeline_events;
DROP POLICY IF EXISTS "auth_all_timeline" ON timeline_events;
CREATE POLICY "auth_all_timeline" ON timeline_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PENDENCIAS
DROP POLICY IF EXISTS "anon_crud_pendencias" ON pendencias;
DROP POLICY IF EXISTS "anon_insert_pendencias" ON pendencias;
DROP POLICY IF EXISTS "anon_update_pendencias" ON pendencias;
DROP POLICY IF EXISTS "anon_delete_pendencias" ON pendencias;
DROP POLICY IF EXISTS "auth_all_pendencias" ON pendencias;
CREATE POLICY "auth_all_pendencias" ON pendencias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CHECKLIST_ITEMS
DROP POLICY IF EXISTS "anon_crud_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_insert_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_update_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_delete_checklist" ON checklist_items;
DROP POLICY IF EXISTS "auth_all_checklist" ON checklist_items;
CREATE POLICY "auth_all_checklist" ON checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COMENTARIOS
DROP POLICY IF EXISTS "anon_crud_comentarios" ON comentarios;
DROP POLICY IF EXISTS "anon_insert_comentarios" ON comentarios;
DROP POLICY IF EXISTS "anon_update_comentarios" ON comentarios;
DROP POLICY IF EXISTS "anon_delete_comentarios" ON comentarios;
DROP POLICY IF EXISTS "auth_all_comentarios" ON comentarios;
CREATE POLICY "auth_all_comentarios" ON comentarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ANEXOS
DROP POLICY IF EXISTS "anon_crud_anexos" ON anexos;
DROP POLICY IF EXISTS "anon_insert_anexos" ON anexos;
DROP POLICY IF EXISTS "anon_update_anexos" ON anexos;
DROP POLICY IF EXISTS "anon_delete_anexos" ON anexos;
DROP POLICY IF EXISTS "auth_all_anexos" ON anexos;
CREATE POLICY "auth_all_anexos" ON anexos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TAGS
DROP POLICY IF EXISTS "anon_crud_tags" ON tags;
DROP POLICY IF EXISTS "anon_insert_tags" ON tags;
DROP POLICY IF EXISTS "anon_update_tags" ON tags;
DROP POLICY IF EXISTS "anon_delete_tags" ON tags;
DROP POLICY IF EXISTS "auth_all_tags" ON tags;
CREATE POLICY "auth_all_tags" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROCESSO_TAGS
DROP POLICY IF EXISTS "anon_crud_processo_tags" ON processo_tags;
DROP POLICY IF EXISTS "anon_insert_processo_tags" ON processo_tags;
DROP POLICY IF EXISTS "anon_update_processo_tags" ON processo_tags;
DROP POLICY IF EXISTS "anon_delete_processo_tags" ON processo_tags;
DROP POLICY IF EXISTS "auth_all_processo_tags" ON processo_tags;
CREATE POLICY "auth_all_processo_tags" ON processo_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DEPENDENCIAS
DROP POLICY IF EXISTS "anon_crud_dependencias" ON dependencias;
DROP POLICY IF EXISTS "anon_insert_dependencias" ON dependencias;
DROP POLICY IF EXISTS "anon_update_dependencias" ON dependencias;
DROP POLICY IF EXISTS "anon_delete_dependencias" ON dependencias;
DROP POLICY IF EXISTS "auth_all_dependencias" ON dependencias;
CREATE POLICY "auth_all_dependencias" ON dependencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
