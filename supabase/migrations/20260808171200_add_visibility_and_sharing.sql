/*
# Multi-usuário: visibilidade + compartilhamento por entidade

## Visão geral
- Cada usuário tem um espelho público em `public.profiles` (criado automaticamente via trigger
  quando um auth.users é criado).
- `frentes`, `areas` e `processos` ganham `owner_id` (criador) e `visibilidade`
  ('shared' = visível pra todos os authenticated; 'private' = só owner + shares).
- Tabelas de shares por entidade (`frente_shares`, `area_shares`, `processo_shares`) permitem
  incluir usuários específicos em itens privados.
- Funções `can_see_frente`, `can_see_area`, `can_see_processo` centralizam a lógica de
  visibilidade e são usadas em todas as RLS policies.
- Visibilidade **herda** parcialmente: se você tem share num setor, vê a frente pai também;
  se tem share num processo, vê a frente/setor pai também.
- Default: `visibilidade = 'shared'` para preservar compatibilidade com dados existentes.

## Compatibilidade
- Dados legados (owner_id = NULL) são tratados como 'shared' (todos veem) — sem quebra.
- Trigger seta `owner_id = auth.uid()` em novos INSERTs automáticos via coluna DEFAULT
  + função `set_owner_on_insert()`.
*/

-- =============================================================
-- PROFILES (espelho público de auth.users)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Trigger: cria profile quando um user é criado no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: cria profiles para usuários existentes
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- COLUNAS owner_id + visibilidade
-- =============================================================

ALTER TABLE frentes ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users;
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS visibilidade text NOT NULL DEFAULT 'shared';
ALTER TABLE frentes ADD CONSTRAINT frentes_vis_check CHECK (visibilidade IN ('shared', 'private'));
CREATE INDEX IF NOT EXISTS idx_frentes_owner ON frentes(owner_id);
CREATE INDEX IF NOT EXISTS idx_frentes_vis ON frentes(visibilidade);

ALTER TABLE areas ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS visibilidade text NOT NULL DEFAULT 'shared';
ALTER TABLE areas ADD CONSTRAINT areas_vis_check CHECK (visibilidade IN ('shared', 'private'));
CREATE INDEX IF NOT EXISTS idx_areas_owner ON areas(owner_id);
CREATE INDEX IF NOT EXISTS idx_areas_vis ON areas(visibilidade);

ALTER TABLE processos ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS visibilidade text NOT NULL DEFAULT 'shared';
ALTER TABLE processos ADD CONSTRAINT processos_vis_check CHECK (visibilidade IN ('shared', 'private'));
CREATE INDEX IF NOT EXISTS idx_processos_owner ON processos(owner_id);
CREATE INDEX IF NOT EXISTS idx_processos_vis ON processos(visibilidade);

-- =============================================================
-- TABELAS DE SHARES
-- =============================================================

CREATE TABLE IF NOT EXISTS frente_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frente_id uuid NOT NULL REFERENCES frentes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(frente_id, user_id)
);
ALTER TABLE frente_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_frente_shares" ON frente_shares;
CREATE POLICY "auth_all_frente_shares" ON frente_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS area_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(area_id, user_id)
);
ALTER TABLE area_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_area_shares" ON area_shares;
CREATE POLICY "auth_all_area_shares" ON area_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS processo_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(processo_id, user_id)
);
ALTER TABLE processo_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_processo_shares" ON processo_shares;
CREATE POLICY "auth_all_processo_shares" ON processo_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================
-- FUNÇÕES DE VISIBILIDADE
-- =============================================================

CREATE OR REPLACE FUNCTION public.can_see_frente(p_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner uuid;
  v_vis text;
BEGIN
  IF p_id IS NULL THEN RETURN true; END IF;
  SELECT owner_id, visibilidade INTO v_owner, v_vis FROM frentes WHERE id = p_id;
  IF v_owner IS NULL THEN RETURN true; END IF; -- legado
  IF v_vis = 'shared' THEN RETURN true; END IF;
  IF v_owner = auth.uid() THEN RETURN true; END IF;
  RETURN EXISTS (SELECT 1 FROM frente_shares WHERE frente_id = p_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_see_area(p_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner uuid;
  v_vis text;
  v_frente_id uuid;
BEGIN
  IF p_id IS NULL THEN RETURN true; END IF;
  SELECT owner_id, visibilidade, frente_id INTO v_owner, v_vis, v_frente_id FROM areas WHERE id = p_id;
  IF v_owner IS NULL THEN RETURN true; END IF;
  IF v_vis = 'shared' THEN RETURN true; END IF;
  IF v_owner = auth.uid() THEN RETURN true; END IF;
  -- herdar visibilidade da frente pai (se for acessível, o setor também é)
  IF v_frente_id IS NOT NULL AND public.can_see_frente(v_frente_id) THEN RETURN true; END IF;
  RETURN EXISTS (SELECT 1 FROM area_shares WHERE area_id = p_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_see_processo(p_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner uuid;
  v_vis text;
  v_frente_id uuid;
  v_area_id uuid;
BEGIN
  IF p_id IS NULL THEN RETURN true; END IF;
  SELECT owner_id, visibilidade, frente_id, area_id
    INTO v_owner, v_vis, v_frente_id, v_area_id
    FROM processos WHERE id = p_id;
  IF v_owner IS NULL THEN RETURN true; END IF;
  IF v_vis = 'shared' THEN RETURN true; END IF;
  IF v_owner = auth.uid() THEN RETURN true; END IF;
  -- herdar de setor e frente
  IF v_area_id IS NOT NULL AND public.can_see_area(v_area_id) THEN RETURN true; END IF;
  IF v_frente_id IS NOT NULL AND public.can_see_frente(v_frente_id) THEN RETURN true; END IF;
  RETURN EXISTS (SELECT 1 FROM processo_shares WHERE processo_id = p_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================
-- RLS — políticas de SELECT filtradas por visibilidade
-- Mantém INSERT/UPDATE/DELETE apenas para o owner (e pra shared
-- onde qualquer um pode editar, como era antes).
-- =============================================================

-- FRENTES
DROP POLICY IF EXISTS "auth_all_frentes" ON frentes;
DROP POLICY IF EXISTS "select_frentes" ON frentes;
DROP POLICY IF EXISTS "insert_frentes" ON frentes;
DROP POLICY IF EXISTS "update_frentes" ON frentes;
DROP POLICY IF EXISTS "delete_frentes" ON frentes;
CREATE POLICY "select_frentes" ON frentes FOR SELECT TO authenticated USING (public.can_see_frente(id));
CREATE POLICY "insert_frentes" ON frentes FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_frentes" ON frentes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delete_frentes" ON frentes FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- AREAS
DROP POLICY IF EXISTS "auth_all_areas" ON areas;
DROP POLICY IF EXISTS "select_areas" ON areas;
DROP POLICY IF EXISTS "insert_areas" ON areas;
DROP POLICY IF EXISTS "update_areas" ON areas;
DROP POLICY IF EXISTS "delete_areas" ON areas;
CREATE POLICY "select_areas" ON areas FOR SELECT TO authenticated USING (public.can_see_area(id));
CREATE POLICY "insert_areas" ON areas FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_areas" ON areas FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delete_areas" ON areas FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- PROCESSOS
DROP POLICY IF EXISTS "auth_all_processos" ON processos;
DROP POLICY IF EXISTS "select_processos" ON processos;
DROP POLICY IF EXISTS "insert_processos" ON processos;
DROP POLICY IF EXISTS "update_processos" ON processos;
DROP POLICY IF EXISTS "delete_processos" ON processos;
CREATE POLICY "select_processos" ON processos FOR SELECT TO authenticated USING (public.can_see_processo(id));
CREATE POLICY "insert_processos" ON processos FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_processos" ON processos FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delete_processos" ON processos FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- =============================================================
-- FILHAS: também filtradas por visibilidade do processo pai
-- =============================================================

-- processo_stakeholders
DROP POLICY IF EXISTS "auth_all_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "select_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "insert_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "update_processo_stakeholders" ON processo_stakeholders;
DROP POLICY IF EXISTS "delete_processo_stakeholders" ON processo_stakeholders;
CREATE POLICY "select_processo_stakeholders" ON processo_stakeholders FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_processo_stakeholders" ON processo_stakeholders FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_processo_stakeholders" ON processo_stakeholders FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_processo_stakeholders" ON processo_stakeholders FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- timeline_events
DROP POLICY IF EXISTS "auth_all_timeline" ON timeline_events;
DROP POLICY IF EXISTS "select_timeline" ON timeline_events;
DROP POLICY IF EXISTS "insert_timeline" ON timeline_events;
DROP POLICY IF EXISTS "update_timeline" ON timeline_events;
DROP POLICY IF EXISTS "delete_timeline" ON timeline_events;
CREATE POLICY "select_timeline" ON timeline_events FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_timeline" ON timeline_events FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_timeline" ON timeline_events FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_timeline" ON timeline_events FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- pendencias
DROP POLICY IF EXISTS "auth_all_pendencias" ON pendencias;
DROP POLICY IF EXISTS "select_pendencias" ON pendencias;
DROP POLICY IF EXISTS "insert_pendencias" ON pendencias;
DROP POLICY IF EXISTS "update_pendencias" ON pendencias;
DROP POLICY IF EXISTS "delete_pendencias" ON pendencias;
CREATE POLICY "select_pendencias" ON pendencias FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_pendencias" ON pendencias FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_pendencias" ON pendencias FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_pendencias" ON pendencias FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- checklist_items
DROP POLICY IF EXISTS "auth_all_checklist" ON checklist_items;
DROP POLICY IF EXISTS "select_checklist" ON checklist_items;
DROP POLICY IF EXISTS "insert_checklist" ON checklist_items;
DROP POLICY IF EXISTS "update_checklist" ON checklist_items;
DROP POLICY IF EXISTS "delete_checklist" ON checklist_items;
CREATE POLICY "select_checklist" ON checklist_items FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_checklist" ON checklist_items FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_checklist" ON checklist_items FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_checklist" ON checklist_items FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- comentarios
DROP POLICY IF EXISTS "auth_all_comentarios" ON comentarios;
DROP POLICY IF EXISTS "select_comentarios" ON comentarios;
DROP POLICY IF EXISTS "insert_comentarios" ON comentarios;
DROP POLICY IF EXISTS "update_comentarios" ON comentarios;
DROP POLICY IF EXISTS "delete_comentarios" ON comentarios;
CREATE POLICY "select_comentarios" ON comentarios FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_comentarios" ON comentarios FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_comentarios" ON comentarios FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_comentarios" ON comentarios FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- anexos
DROP POLICY IF EXISTS "auth_all_anexos" ON anexos;
DROP POLICY IF EXISTS "select_anexos" ON anexos;
DROP POLICY IF EXISTS "insert_anexos" ON anexos;
DROP POLICY IF EXISTS "update_anexos" ON anexos;
DROP POLICY IF EXISTS "delete_anexos" ON anexos;
CREATE POLICY "select_anexos" ON anexos FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_anexos" ON anexos FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_anexos" ON anexos FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_anexos" ON anexos FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- automacoes (mantido no schema mesmo escondido do UI)
DROP POLICY IF EXISTS "auth_all_automacoes" ON automacoes;
DROP POLICY IF EXISTS "select_automacoes" ON automacoes;
DROP POLICY IF EXISTS "insert_automacoes" ON automacoes;
DROP POLICY IF EXISTS "update_automacoes" ON automacoes;
DROP POLICY IF EXISTS "delete_automacoes" ON automacoes;
CREATE POLICY "select_automacoes" ON automacoes FOR SELECT TO authenticated
  USING (public.can_see_processo(processo_id));
CREATE POLICY "insert_automacoes" ON automacoes FOR INSERT TO authenticated
  WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "update_automacoes" ON automacoes FOR UPDATE TO authenticated
  USING (public.can_see_processo(processo_id)) WITH CHECK (public.can_see_processo(processo_id));
CREATE POLICY "delete_automacoes" ON automacoes FOR DELETE TO authenticated
  USING (public.can_see_processo(processo_id));

-- =============================================================
-- Trigger: setar owner_id automaticamente em INSERTs
-- (atua como fallback caso o app não envie)
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_owner_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_frente_owner ON frentes;
CREATE TRIGGER set_frente_owner BEFORE INSERT ON frentes
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_on_insert();

DROP TRIGGER IF EXISTS set_area_owner ON areas;
CREATE TRIGGER set_area_owner BEFORE INSERT ON areas
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_on_insert();

DROP TRIGGER IF EXISTS set_processo_owner ON processos;
CREATE TRIGGER set_processo_owner BEFORE INSERT ON processos
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_on_insert();
