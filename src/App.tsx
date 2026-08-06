import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Layers, FolderKanban, List, Calendar, GitBranch,
  Search, Plus, AlertTriangle, Bot, ChevronRight, LogOut,
} from 'lucide-react';
import { useFrentes, useProcessos } from './lib/hooks';
import { useAuth } from './lib/auth';

import Dashboard from './views/Dashboard';
import FrentesView from './views/FrentesView';
import ProcessoView from './views/ProcessoView';
import AutomacaoView from './views/AutomacaoView';
import KanbanView from './views/KanbanView';
import ListaView from './views/ListaView';
import CalendarioView from './views/CalendarioView';
import GlobalTimeline from './views/GlobalTimeline';
import AIPanel from './views/AIPanel';
import SearchModal from './components/SearchModal';
import { ViewErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './views/LoginPage';

type View =
  | { name: 'dashboard' }
  | { name: 'frentes' }
  | { name: 'processo'; id: string }
  | { name: 'automacao'; id: string }
  | { name: 'kanban' }
  | { name: 'lista' }
  | { name: 'calendario' }
  | { name: 'timeline' }
  | { name: 'ai' };

export default function App() {
  const { session, loading: authLoading, signOut, user } = useAuth();

  // Auth gate (renderizado antes de chamar hooks que dependem de auth)
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <LoginPage />;

  return <AuthenticatedApp user={user} signOut={signOut} />;
}

function AuthenticatedApp({ user, signOut }: { user: any; signOut: () => void }) {
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [navHistory, setNavHistory] = useState<View[]>([]);

  const { frentes, loading: frentesLoading, refetch: refetchFrentes } = useFrentes();
  const { processos, loading: processosLoading, refetch: refetchProcessos } = useProcessos();

  function refreshAll() {
    refetchFrentes();
    refetchProcessos();
  }

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function navigate(newView: View) {
    setNavHistory((prev) => [...prev, view]);
    setView(newView);
  }

  function goBack() {
    if (navHistory.length === 0) return;
    const last = navHistory[navHistory.length - 1];
    setNavHistory((prev) => prev.slice(0, -1));
    setView(last);
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'frentes', label: 'Frentes', icon: Layers },
    { id: 'kanban', label: 'Kanban', icon: FolderKanban },
    { id: 'lista', label: 'Lista', icon: List },
    { id: 'timeline', label: 'Timeline', icon: GitBranch },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'ai', label: 'Assistente IA', icon: Bot },
  ];

  const activeNav = view.name === 'processo' || view.name === 'automacao' ? null : view.name;
  const processoCount = processos.length;
  const blockedCount = processos.filter((p) => p.status === 'bloqueado').length;

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-subtle bg-surface">
        {/* Header com gradient */}
        <div className="relative overflow-hidden border-b border-subtle px-5 py-5">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-deep/30 via-brand-primary/10 to-brand-magenta/20" />
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-primary/30 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <img src="./logo.png" alt="REDESIGN" className="h-9 w-9 rounded-lg object-contain" />
            <div>
              <p className="bg-gradient-to-r from-brand-pale to-brand-light bg-clip-text text-sm font-bold tracking-tight text-transparent">FlowRPA</p>
              <p className="text-[10px] text-tertiary">Gestão de Processos</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="group mx-3 mb-3 mt-3 flex items-center gap-2 rounded-lg border border-subtle bg-elevated px-3 py-2 text-xs text-tertiary transition-all hover:border-brand-primary/50 hover:bg-hover-state hover:text-secondary"
        >
          <Search className="h-3.5 w-3.5 transition-colors group-hover:text-brand-light" />
          <span>Pesquisar...</span>
          <kbd className="ml-auto rounded bg-base px-1.5 py-0.5 text-[10px] text-tertiary">⌘K</kbd>
        </button>

        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ name: item.id as any })}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'text-white font-medium shadow-md shadow-brand-primary/20'
                    : 'text-secondary hover:bg-hover-state hover:text-primary'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-primary to-brand-magenta" />
                )}
                <Icon className={`relative h-4 w-4 ${active ? 'text-white' : ''}`} />
                <span className="relative">{item.label}</span>
                {item.id === 'frentes' && processoCount > 0 && (
                  <span className={`relative ml-auto text-[10px] ${active ? 'text-white/80' : 'text-tertiary'}`}>{processoCount}</span>
                )}
                {item.id === 'dashboard' && blockedCount > 0 && (
                  <span className="relative ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500/30 text-[9px] text-white">
                    {blockedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-subtle p-3 space-y-2">
          <div className="rounded-lg bg-elevated p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs font-medium text-primary">Alertas</p>
            </div>
            <p className="mt-1 text-[11px] text-tertiary">
              {blockedCount > 0 ? `${blockedCount} processo(s) bloqueado(s)` : 'Nenhum alerta ativo'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-tertiary transition-colors hover:bg-hover-state hover:text-primary"
            title={user?.email}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="truncate">Sair ({user?.email?.split('@')[0]})</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Accent line no topo */}
        <div className="h-0.5 bg-gradient-to-r from-brand-deep via-brand-primary via-brand-magenta to-brand-orange opacity-60" />
        <ViewErrorBoundary resetKey={view.name + (view.name === 'processo' || view.name === 'automacao' ? view.id : '')}>
          {view.name === 'dashboard' && (
            <Dashboard processos={processos} frentes={frentes} loading={processosLoading} onNavigate={navigate} />
          )}
          {view.name === 'frentes' && (
            <FrentesView
              frentes={frentes}
              processos={processos}
              loading={frentesLoading}
              onOpenProcesso={(id) => navigate({ name: 'processo', id })}
              onRefresh={refreshAll}
            />
          )}
          {view.name === 'processo' && (
            <ProcessoView
              processoId={view.id}
              onBack={goBack}
              onOpenAutomacao={(id) => navigate({ name: 'automacao', id })}
            />
          )}
          {view.name === 'automacao' && (
            <AutomacaoView automacaoId={view.id} onBack={goBack} />
          )}
          {view.name === 'kanban' && (
            <KanbanView processos={processos} loading={processosLoading} onOpenProcesso={(id) => navigate({ name: 'processo', id })} onProcessoMoved={refreshAll} />
          )}
          {view.name === 'lista' && (
            <ListaView processos={processos} loading={processosLoading} onOpenProcesso={(id) => navigate({ name: 'processo', id })} />
          )}
          {view.name === 'calendario' && (
            <CalendarioView processos={processos} onOpenProcesso={(id) => navigate({ name: 'processo', id })} />
          )}
          {view.name === 'timeline' && (
            <GlobalTimeline processos={processos} onOpenProcesso={(id) => navigate({ name: 'processo', id })} />
          )}
          {view.name === 'ai' && (
            <AIPanel processos={processos} onOpenProcesso={(id) => navigate({ name: 'processo', id })} />
          )}
        </ViewErrorBoundary>
      </main>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        processos={processos}
        frentes={frentes}
        onOpenProcesso={(id) => { setSearchOpen(false); navigate({ name: 'processo', id }); }}
      />
    </div>
  );
}
