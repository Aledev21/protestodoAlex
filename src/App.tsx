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
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src="./logo.png" alt="REDESIGN" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-semibold text-primary">FlowRPA</p>
            <p className="text-[10px] text-tertiary">Gestão de Processos</p>
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-subtle bg-elevated px-3 py-2 text-xs text-tertiary transition-colors hover:border-default hover:text-secondary"
        >
          <Search className="h-3.5 w-3.5" />
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-primary/10 text-brand-light font-medium'
                    : 'text-secondary hover:bg-hover-state hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === 'frentes' && processoCount > 0 && (
                  <span className="ml-auto text-[10px] text-tertiary">{processoCount}</span>
                )}
                {item.id === 'dashboard' && blockedCount > 0 && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-[9px] text-red-400">
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
