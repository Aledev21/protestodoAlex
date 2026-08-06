# Workflow RPA

Sistema de gestão de processos para analistas de **RPA / IA**. Organize frentes de trabalho, processos, automações, checklists, pendências, timelines e dashboards em um único lugar.

🔗 **Demo online:** https://aledev21.github.io/protestodoAlex/

---

## ✨ Funcionalidades

- **Frentes** — agrupadoras de trabalho (clientes / projetos)
- **Processos** — unidades de trabalho com etapa, status, prioridade e responsável
- **Automações** — vinculadas a processos, com tipo, sprint, progresso e documentação
- **Stakeholders** — analistas, GPs, SMEs, clientes, liderança
- **Checklist** — por processo e por automação
- **Pendências** — bloqueios, dependências, dúvidas, aguardando
- **Timeline** — histórico cronológico de eventos
- **Comentários e anexos** por processo
- **Tags e dependências** entre processos/automações
- **Dashboard** com métricas gerais

## 🛠️ Stack

- **React 18** + **TypeScript**
- **Vite** (build)
- **Tailwind CSS** (estilo)
- **Supabase** (banco de dados Postgres + API realtime)
- **Lucide React** (ícones)

## 🚀 Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com sua SUPABASE_URL e SUPABASE_ANON_KEY

# 3. Subir o dev server
npm run dev
```

Acesse http://localhost:5173

## 📦 Build de produção

```bash
npm run build      # gera ./dist
npm run preview    # serve ./dist localmente pra conferir
```

## 🗄️ Configurar o Supabase

1. Crie um projeto em https://supabase.com
2. No **SQL Editor**, rode o arquivo consolidado [`supabase/init-all.sql`](./supabase/init-all.sql) (esse arquivo junta as migrations na ordem)
3. Copie **Project URL** e **Publishable key** em *Settings → API*
4. Cole no seu `.env` local
5. Adicione as mesmas duas variáveis como **secrets** no GitHub (*Settings → Secrets and variables → Actions*)

### Modelo de dados

16 tabelas: `frentes`, `clientes`, `areas`, `stakeholders`, `processos`, `processo_stakeholders`, `automacoes`, `timeline_events`, `pendencias`, `checklist_items`, `comentarios`, `anexos`, `tags`, `processo_tags`, `dependencias`, `stakeholder_types`.

RLS habilitado com policies permissivas para `anon` e `authenticated` (uso single-tenant, dados compartilhados).

As migrations versionadas ficam em [`supabase/migrations/`](./supabase/migrations/).

## 🌐 Deploy (GitHub Pages)

O workflow em [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) faz build e deploy automático a cada push na `main`.

Para funcionar:
1. *Settings → Pages → Source* → **GitHub Actions**
2. Adicione os 2 secrets no repo: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Dê `git push origin main`

A URL final fica em `https://<user>.github.io/<repo>/`.

## 📁 Estrutura

```
src/
  components/      # componentes de UI
  views/           # telas principais
  lib/             # integrações (supabase, helpers)
  hooks/           # custom hooks
  utils/           # utilitários
supabase/
  migrations/      # SQL versionado
  init-all.sql     # consolidado pra setup rápido
```

## 📝 Licença

MIT — veja [LICENSE](./LICENSE).
