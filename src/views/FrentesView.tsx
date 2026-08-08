import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, Plus, FileText, ArrowLeft, FolderOpen, Filter, Check,
  ChevronDown, Archive, ArchiveRestore, Trash2, Edit3, AlertOctagon,
  Building2, Folder, Search, X as XIcon,
} from 'lucide-react';
import { Processo, Frente, Area, Stakeholder, Cliente } from '../lib/types';
import { Card, Badge, Button, Modal, Input, TextArea, Select } from '../components/ui';
import ThreeDotMenu, { ThreeDotMenuItem } from '../components/ThreeDotMenu';
import {
  getStatusLabel, getEtapaLabel, getPrioridadeLabel,
  STATUS_PROCESSO, PRIORIDADES, ETAPAS_PROCESSO,
} from '../lib/constants';
import { useStakeholders, useClientes, useAreas } from '../lib/hooks';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

export default function FrentesView({
  frentes,
  processos,
  loading,
  onOpenProcesso,
  onRefresh,
}: {
  frentes: Frente[];
  processos: Processo[];
  loading: boolean;
  onOpenProcesso: (id: string) => void;
  onRefresh: () => void;
}) {
  const { areas, refetch: refetchAreas } = useAreas();
  const { stakeholders } = useStakeholders();
  const { clientes } = useClientes();
  const { notify } = useToast();

  const [expandedFrente, setExpandedFrente] = useState<string | null>(null);
  const [expandedSetor, setExpandedSetor] = useState<string | null>(null);
  const [showNewProcesso, setShowNewProcesso] = useState<string | null>(null);
  const [showNewFrente, setShowNewFrente] = useState(false);
  const [showNewSetor, setShowNewSetor] = useState<string | null>(null);
  // Filtro multi-select: Set de values. Vazio = sem filtro (mostra tudo).
  const [etapaFilters, setEtapaFilters] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  // 3-dot menus (controlados por id). Apenas 1 aberto por vez.
  const [menuOpenFrente, setMenuOpenFrente] = useState<string | null>(null);
  const [menuOpenSetor, setMenuOpenSetor] = useState<string | null>(null);
  const [menuOpenProcesso, setMenuOpenProcesso] = useState<string | null>(null);

  // search
  const [search, setSearch] = useState('');

  // archived toggle
  const [showArchived, setShowArchived] = useState(false);

  // edit / delete modals
  const [editFrente, setEditFrente] = useState<Frente | null>(null);
  const [deleteFrente, setDeleteFrente] = useState<Frente | null>(null);
  const [editSetor, setEditSetor] = useState<Area | null>(null);
  const [deleteSetor, setDeleteSetor] = useState<Area | null>(null);
  const [editProcesso, setEditProcesso] = useState<Processo | null>(null);
  const [deleteProcesso, setDeleteProcesso] = useState<Processo | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  // Helpers de toggle do filtro multi-select.
  function toggleEtapaFilter(value: string) {
    setEtapaFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }
  function clearEtapaFilters() {
    setEtapaFilters(new Set());
  }

  function toggleFrente(id: string) {
    setExpandedFrente((prev) => (prev === id ? null : id));
  }
  function toggleSetor(id: string) {
    setExpandedSetor((prev) => (prev === id ? null : id));
  }

  async function archiveFrente(frente: Frente) {
    const newVal = !frente.arquivado;
    const { error } = await supabase.from('frentes').update({ arquivado: newVal }).eq('id', frente.id);
    if (error) {
      console.error('[archiveFrente]', error.message);
      notify('error', 'Erro ao arquivar empresa');
      return;
    }
    notify('success', newVal ? 'Empresa arquivada' : 'Empresa desarquivada');
    setMenuOpenFrente(null);
    onRefresh();
  }
  async function deleteFrentePermanently(frente: Frente) {
    const { error } = await supabase.from('frentes').delete().eq('id', frente.id);
    if (error) {
      console.error('[deleteFrente]', error.message);
      notify('error', 'Erro ao excluir empresa');
      return;
    }
    notify('success', 'Empresa excluída');
    setDeleteFrente(null);
    onRefresh();
  }
  async function deleteSetorPermanently(setor: Area) {
    const { error } = await supabase.from('areas').delete().eq('id', setor.id);
    if (error) {
      console.error('[deleteSetor]', error.message);
      notify('error', 'Erro ao excluir setor');
      return;
    }
    notify('success', 'Setor excluído');
    setDeleteSetor(null);
    onRefresh();
  }
  async function archiveSetor(setor: Area) {
    const newVal = !setor.arquivado;
    const { error } = await supabase.from('areas').update({ arquivado: newVal }).eq('id', setor.id);
    if (error) {
      console.error('[archiveSetor]', error.message);
      notify('error', 'Erro ao arquivar setor');
      return;
    }
    notify('success', newVal ? 'Setor arquivado' : 'Setor desarquivado');
    setMenuOpenSetor(null);
    refetchAreas();
    onRefresh();
  }
  async function deleteProcessoPermanently(p: Processo) {
    const { error } = await supabase.from('processos').delete().eq('id', p.id);
    if (error) {
      console.error('[deleteProcesso]', error.message);
      notify('error', 'Erro ao excluir processo');
      return;
    }
    notify('success', 'Processo excluído');
    setDeleteProcesso(null);
    onRefresh();
  }

  async function archiveProcesso(p: Processo) {
    const newVal = !p.arquivado;
    const { error } = await supabase.from('processos').update({ arquivado: newVal }).eq('id', p.id);
    if (error) {
      console.error('[archiveProcesso]', error.message);
      notify('error', 'Erro ao arquivar processo');
      return;
    }
    notify('success', newVal ? 'Processo arquivado' : 'Processo desarquivado');
    setMenuOpenProcesso(null);
    onRefresh();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const etapaFilterLabel =
    etapaFilters.size === 0
      ? 'Filtrar por etapa'
      : etapaFilters.size === 1
        ? ETAPAS_PROCESSO.find((e) => e.value === [...etapaFilters][0])?.label ?? 'Filtrar por etapa'
        : `${etapaFilters.size} etapas`;
  const totalFiltered = etapaFilters.size === 0
    ? processos.length
    : processos.filter((p) => etapaFilters.has(p.etapa)).length;

  const visibleFrentes = frentes.filter((f) => showArchived || !f.arquivado);

  // search: match by frente nome OR by any processo nome within
  const searchLower = search.toLowerCase().trim();
  const frenteMatches = (f: Frente) => {
    if (!searchLower) return true;
    if (f.nome.toLowerCase().includes(searchLower)) return true;
    if (f.descricao?.toLowerCase().includes(searchLower)) return true;
    return processos.some((p) =>
      p.frente_id === f.id &&
      (p.nome.toLowerCase().includes(searchLower) ||
       p.cliente?.nome?.toLowerCase().includes(searchLower) ||
       p.responsavel?.nome?.toLowerCase().includes(searchLower))
    );
  };
  const searchedFrentes = visibleFrentes.filter(frenteMatches);
  const totalSearchHits = processos.filter((p) =>
    !searchLower
      ? true
      : p.nome.toLowerCase().includes(searchLower) ||
        p.cliente?.nome?.toLowerCase().includes(searchLower) ||
        p.responsavel?.nome?.toLowerCase().includes(searchLower)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">Frentes</h1>
        <p className="mt-1 text-sm text-tertiary">Organize seus processos por empresa, setor e processo</p>
      </div>

      {/* Search + filters + new */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da empresa ou do processo..."
            className="w-full rounded-lg border border-default bg-surface py-2 pl-9 pr-9 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-tertiary hover:bg-hover-state hover:text-primary"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              etapaFilters.size > 0
                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-light'
                : 'border-default bg-elevated text-secondary hover:bg-hover-state'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{etapaFilterLabel}</span>
            {etapaFilters.size > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                {etapaFilters.size}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-72 rounded-xl border border-default bg-surface shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Filtrar por etapa</p>
                {etapaFilters.size > 0 && (
                  <button
                    onClick={clearEtapaFilters}
                    className="text-[10px] font-medium text-brand-light hover:text-brand-lavender transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5">
                {ETAPAS_PROCESSO.map((etapa) => {
                  const checked = etapaFilters.has(etapa.value);
                  return (
                    <button
                      key={etapa.value}
                      onClick={() => toggleEtapaFilter(etapa.value)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        checked ? 'bg-brand-primary/10 text-brand-light' : 'text-secondary hover:bg-hover-state'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                          checked ? 'border-brand-primary bg-brand-primary' : 'border-default bg-elevated'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-tertiary flex-shrink-0">{etapa.group}</span>
                        <span className="truncate">{etapa.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <Button icon={Plus} onClick={() => setShowNewFrente(true)}>Nova Frente</Button>
      </div>

      {search && (
        <p className="mb-3 text-xs text-tertiary">
          {totalSearchHits} resultado(s) para &quot;{search}&quot; em {searchedFrentes.length} empresa(s)
        </p>
      )}

      {etapaFilters.size > 0 && (
        <p className="mb-4 text-xs text-tertiary">
          Mostrando {totalFiltered} processo(s) em {etapaFilters.size} {etapaFilters.size === 1 ? 'etapa' : 'etapas'} selecionada(s)
        </p>
      )}

      {/* ===== 3-level accordion ===== */}
      <div className="space-y-4">
        {searchedFrentes.map((frente) => {
          const allFrentesSetores = areas.filter((a) => a.frente_id === frente.id);
          const frenteSetores = allFrentesSetores.filter((a) => showArchived || !a.arquivado);
          const frenteProcessosAll = processos.filter((p) => p.frente_id === frente.id);
          const frenteProcessos = frenteProcessosAll.filter(
            (p) => etapaFilters.size === 0 || etapaFilters.has(p.etapa)
          );
          const isExpanded = expandedFrente === frente.id;

          return (
            <Card key={frente.id} className={`overflow-hidden ${frente.arquivado ? 'opacity-60' : ''}`}>
              {/* --- Level 1: Empresa --- */}
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-hover-state transition-colors">
                <button
                  onClick={() => toggleFrente(frente.id)}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                >
                  <ChevronRight className={`h-4 w-4 text-tertiary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                  <Building2 className="h-5 w-5 flex-shrink-0" style={{ color: frente.cor || '#9100E2' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-primary truncate">{frente.nome}</p>
                      {frente.arquivado && <Badge color="slate">Arquivada</Badge>}
                    </div>
                    {frente.descricao && <p className="text-xs text-tertiary truncate">{frente.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-tertiary flex-shrink-0">
                    <span>{frenteSetores.length} setores</span>
                    <span>{frenteProcessos.length} processos</span>
                  </div>
                </button>
                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowNewProcesso(frente.id)}>
                  Novo Processo
                </Button>
                {/* 3-dot menu — usa position:fixed para escapar overflow */}
                <ThreeDotMenu
                  open={menuOpenFrente === frente.id}
                  onOpenChange={(o) => {
                    setMenuOpenFrente(o ? frente.id : null);
                    if (o) { setMenuOpenSetor(null); setMenuOpenProcesso(null); }
                  }}
                  items={buildFrenteMenu(frente, {
                    onEdit: () => setEditFrente(frente),
                    onNewSetor: () => setShowNewSetor(frente.id),
                    onArchive: () => archiveFrente(frente),
                    onDelete: () => setDeleteFrente(frente),
                  })}
                />
              </div>

              {/* --- Level 2: Setores --- */}
              {isExpanded && (
                <div className="border-t border-subtle animate-slide-up bg-elevated/30">
                  <div className="flex items-center justify-between gap-2 px-5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Setores</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowNewProcesso(frente.id)}>Novo Processo</Button>
                      <Button size="sm" icon={Plus} onClick={() => setShowNewSetor(frente.id)}>Novo Setor</Button>
                    </div>
                  </div>

                  {frenteSetores.length === 0 && (
                    <p className="px-5 py-6 text-center text-sm text-tertiary">Nenhum setor nesta empresa ainda</p>
                  )}

                  <div className="space-y-1 px-3 pb-3">
                    {frenteSetores.map((setor) => {
                      const setorProcessos = frenteProcessos.filter((p) => p.area_id === setor.id);
                      const setorExpanded = expandedSetor === setor.id;

                      return (
                        <div key={setor.id} className={`rounded-lg bg-surface/50 ${setor.arquivado ? 'opacity-60' : ''}`}>
                          {/* Setor header */}
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover-state transition-colors">
                            <button
                              onClick={() => toggleSetor(setor.id)}
                              className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                            >
                              <ChevronRight className={`h-3.5 w-3.5 text-tertiary transition-transform flex-shrink-0 ${setorExpanded ? 'rotate-90' : ''}`} />
                              <Folder className={`h-4 w-4 flex-shrink-0 ${setor.arquivado ? 'text-slate-500' : 'text-amber-400'}`} />
                              <p className="text-sm font-medium text-primary truncate">{setor.nome}</p>
                              {setor.arquivado && <Badge color="slate">Arquivado</Badge>}
                              <span className="text-xs text-tertiary">{setorProcessos.length} processos</span>
                            </button>
                            <ThreeDotMenu
                              open={menuOpenSetor === setor.id}
                              onOpenChange={(o) => {
                                setMenuOpenSetor(o ? setor.id : null);
                                if (o) { setMenuOpenFrente(null); setMenuOpenProcesso(null); }
                              }}
                              items={buildSetorMenu(setor, {
                                onEdit: () => setEditSetor(setor),
                                onNewProcesso: () => setShowNewProcesso(frente.id),
                                onArchive: () => archiveSetor(setor),
                                onDelete: () => setDeleteSetor(setor),
                              })}
                            />
                          </div>

                          {/* --- Level 3: Processos --- */}
                          {setorExpanded && (
                            <div className="ml-6 border-l border-subtle pl-2 animate-slide-up">
                              {setorProcessos.length === 0 && (
                                <p className="px-3 py-4 text-center text-xs text-tertiary">Nenhum processo neste setor</p>
                              )}
                              {setorProcessos.map((p) => (
                                <div key={p.id} className={`group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover-state transition-colors ${p.arquivado ? 'opacity-60' : ''}`}>
                                  <button
                                    onClick={() => onOpenProcesso(p.id)}
                                    className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                                  >
                                    <FileText className="h-4 w-4 flex-shrink-0 text-brand-light" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                                      <p className="text-xs text-tertiary">{p.cliente?.nome || 'Sem cliente'}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {/* Coluna Etapa (era o pedido: mostrar a coluna do Kanban aqui) */}
                                      <Badge color="brand">{getEtapaLabel(p.etapa)}</Badge>
                                      <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                                        {getStatusLabel(p.status)}
                                      </Badge>
                                      <Badge color={PRIORIDADES.find((pr) => pr.value === p.prioridade)?.color}>
                                        {getPrioridadeLabel(p.prioridade)}
                                      </Badge>
                                    </div>
                                  </button>
                                  <ThreeDotMenu
                                    open={menuOpenProcesso === p.id}
                                    onOpenChange={(o) => {
                                      setMenuOpenProcesso(o ? p.id : null);
                                      if (o) { setMenuOpenFrente(null); setMenuOpenSetor(null); }
                                    }}
                                    items={buildProcessoMenu(p, {
                                      onOpen: () => onOpenProcesso(p.id),
                                      onEdit: () => setEditProcesso(p),
                                      onArchive: () => archiveProcesso(p),
                                      onDelete: () => setDeleteProcesso(p),
                                    })}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Processos without a setor (area_id null) — legacy bucket */}
                    {frenteProcessos.filter((p) => !p.area_id).length > 0 && (
                      <div className="rounded-lg bg-surface/50">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover-state transition-colors">
                          <button
                            onClick={() => toggleSetor('__sem_setor')}
                            className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                          >
                            <ChevronRight className={`h-3.5 w-3.5 text-tertiary transition-transform flex-shrink-0 ${expandedSetor === '__sem_setor' ? 'rotate-90' : ''}`} />
                            <Folder className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            <p className="text-sm font-medium text-secondary truncate">Sem setor</p>
                            <span className="text-xs text-tertiary">{frenteProcessos.filter((p) => !p.area_id).length} processos</span>
                          </button>
                        </div>
                        {expandedSetor === '__sem_setor' && (
                          <div className="ml-6 border-l border-subtle pl-2 animate-slide-up">
                            {frenteProcessos.filter((p) => !p.area_id).map((p) => (
                              <button
                                key={p.id}
                                onClick={() => onOpenProcesso(p.id)}
                                className="group flex w-full items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-hover-state transition-colors"
                              >
                                <FileText className="h-4 w-4 flex-shrink-0 text-brand-light" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                                  <p className="text-xs text-tertiary">{p.cliente?.nome || 'Sem cliente'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge color="brand">{getEtapaLabel(p.etapa)}</Badge>
                                  <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                                    {getStatusLabel(p.status)}
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {searchedFrentes.length === 0 && !loading && (
          <Card className="p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <FolderOpen className="h-10 w-10 text-tertiary" />
              <p className="text-sm text-secondary">{search ? 'Nenhum resultado para a busca' : 'Nenhuma frente cadastrada'}</p>
              {search ? (
                <Button variant="ghost" onClick={() => setSearch('')}>Limpar busca</Button>
              ) : (
                <Button icon={Plus} onClick={() => setShowNewFrente(true)}>Criar primeira frente</Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Archived toggle — mostra se houver Frentes OU Setores arquivados */}
      {(frentes.some((f) => f.arquivado) || areas.some((a) => a.arquivado)) && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              showArchived ? 'bg-brand-primary/10 text-brand-light' : 'text-tertiary hover:text-secondary'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
            <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px]">
              {frentes.filter((f) => f.arquivado).length + areas.filter((a) => a.arquivado).length}
            </span>
          </button>
        </div>
      )}

      {/* ===== Modals ===== */}
      <NewFrenteModal open={showNewFrente} onClose={() => setShowNewFrente(false)} onDone={onRefresh} />
      <NewSetorModal
        open={!!showNewSetor}
        onClose={() => setShowNewSetor(null)}
        frenteId={showNewSetor}
        onDone={() => { refetchAreas(); onRefresh(); }}
      />
      <NewProcessoModal
        open={!!showNewProcesso}
        onClose={() => setShowNewProcesso(null)}
        frenteId={showNewProcesso}
        setores={showNewProcesso ? areas.filter((a) => a.frente_id === showNewProcesso) : []}
        stakeholders={stakeholders}
        clientes={clientes}
        onDone={onRefresh}
      />
      <EditFrenteModal frente={editFrente} onClose={() => setEditFrente(null)} onDone={onRefresh} />
      <EditSetorModal setor={editSetor} onClose={() => setEditSetor(null)} onDone={() => { refetchAreas(); onRefresh(); }} />
      <EditProcessoModal
        processo={editProcesso}
        onClose={() => setEditProcesso(null)}
        stakeholders={stakeholders}
        clientes={clientes}
        setores={areas}
        onDone={onRefresh}
      />

      {/* Delete: Frente */}
      <Modal open={!!deleteFrente} onClose={() => setDeleteFrente(null)} title="Excluir empresa" width="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-primary">Tem certeza?</p>
              <p className="mt-1 text-xs text-secondary">
                A empresa &quot;{deleteFrente?.nome}&quot; será excluída permanentemente, junto com todos os seus setores, processos, automações, timeline e dados relacionados. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteFrente(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => deleteFrente && deleteFrentePermanently(deleteFrente)}>
              Excluir permanentemente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete: Setor */}
      <Modal open={!!deleteSetor} onClose={() => setDeleteSetor(null)} title="Excluir setor" width="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-primary">Tem certeza?</p>
              <p className="mt-1 text-xs text-secondary">
                O setor &quot;{deleteSetor?.nome}&quot; será excluído permanentemente. Processos vinculados a este setor terão o setor removido, mas não serão apagados.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteSetor(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => deleteSetor && deleteSetorPermanently(deleteSetor)}>
              Excluir permanentemente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete: Processo */}
      <Modal open={!!deleteProcesso} onClose={() => setDeleteProcesso(null)} title="Excluir processo" width="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-primary">Tem certeza?</p>
              <p className="mt-1 text-xs text-secondary">
                O processo &quot;{deleteProcesso?.nome}&quot; será excluído permanentemente, junto com suas automações, timeline, checklist e dados relacionados. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteProcesso(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => deleteProcesso && deleteProcessoPermanently(deleteProcesso)}>
              Excluir permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =================== Menu builders ===================

function buildFrenteMenu(frente: Frente, cbs: { onEdit: () => void; onNewSetor: () => void; onArchive: () => void; onDelete: () => void }): ThreeDotMenuItem[] {
  return [
    { label: 'Editar Empresa', icon: Edit3, onClick: cbs.onEdit },
    { label: 'Novo Setor', icon: Folder, onClick: cbs.onNewSetor, divider: true },
    { label: frente.arquivado ? 'Desarquivar' : 'Arquivar', icon: frente.arquivado ? ArchiveRestore : Archive, onClick: cbs.onArchive },
    { label: 'Excluir', icon: Trash2, onClick: cbs.onDelete, danger: true },
  ];
}

function buildSetorMenu(setor: Area, cbs: { onEdit: () => void; onNewProcesso: () => void; onArchive: () => void; onDelete: () => void }): ThreeDotMenuItem[] {
  return [
    { label: 'Editar Setor', icon: Edit3, onClick: cbs.onEdit },
    { label: 'Novo Processo', icon: FileText, onClick: cbs.onNewProcesso, divider: true },
    { label: setor.arquivado ? 'Desarquivar' : 'Arquivar', icon: setor.arquivado ? ArchiveRestore : Archive, onClick: cbs.onArchive },
    { label: 'Excluir', icon: Trash2, onClick: cbs.onDelete, danger: true },
  ];
}

function buildProcessoMenu(p: Processo, cbs: { onOpen: () => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }): ThreeDotMenuItem[] {
  return [
    { label: 'Abrir Processo', icon: ChevronRight, onClick: cbs.onOpen },
    { label: 'Editar Processo', icon: Edit3, onClick: cbs.onEdit, divider: true },
    { label: p.arquivado ? 'Desarquivar' : 'Arquivar', icon: p.arquivado ? ArchiveRestore : Archive, onClick: cbs.onArchive },
    { label: 'Excluir', icon: Trash2, onClick: cbs.onDelete, danger: true, divider: true },
  ];
}

// =================== Modals ===================

function EditFrenteModal({ frente, onClose, onDone }: { frente: Frente | null; onClose: () => void; onDone: () => void }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const { notify } = useToast();

  useEffect(() => {
    if (frente) {
      setNome(frente.nome);
      setDescricao(frente.descricao || '');
      setCor(frente.cor || '#3b82f6');
    }
  }, [frente]);

  async function handleSubmit() {
    if (!nome || !frente) return;
    const { error } = await supabase.from('frentes').update({ nome, descricao, cor }).eq('id', frente.id);
    if (error) {
      console.error('[EditFrenteModal]', error.message);
      notify('error', 'Erro ao salvar empresa');
      return;
    }
    notify('success', 'Empresa atualizada');
    onClose();
    onDone();
  }

  return (
    <Modal open={!!frente} onClose={onClose} title="Editar Empresa">
      <div className="space-y-4">
        <Input label="Nome" value={nome} onChange={setNome} placeholder="Ex: Emana Pay" required />
        <TextArea label="Descrição" value={descricao} onChange={setDescricao} placeholder="Descrição da empresa..." />
        <div>
          <span className="mb-1.5 block text-xs font-medium text-secondary">Cor</span>
          <div className="flex gap-2">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`h-8 w-8 rounded-lg ${cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </div>
      </div>
    </Modal>
  );
}

function NewFrenteModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const { notify } = useToast();

  async function handleSubmit() {
    if (!nome) return;
    const { error } = await supabase.from('frentes').insert({ nome, descricao, cor });
    if (error) {
      console.error('[NewFrenteModal]', error.message);
      notify('error', 'Erro ao criar empresa');
      return;
    }
    notify('success', 'Empresa criada');
    setNome(''); setDescricao(''); setCor('#3b82f6');
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Empresa">
      <div className="space-y-4">
        <Input label="Nome" value={nome} onChange={setNome} placeholder="Ex: Emana Pay" required />
        <TextArea label="Descrição" value={descricao} onChange={setDescricao} placeholder="Descrição da empresa..." />
        <div>
          <span className="mb-1.5 block text-xs font-medium text-secondary">Cor</span>
          <div className="flex gap-2">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`h-8 w-8 rounded-lg ${cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar Empresa</Button>
        </div>
      </div>
    </Modal>
  );
}

function NewSetorModal({ open, onClose, frenteId, onDone }: { open: boolean; onClose: () => void; frenteId: string | null; onDone: () => void }) {
  const [nome, setNome] = useState('');
  const { notify } = useToast();

  async function handleSubmit() {
    if (!nome || !frenteId) return;
    const { error } = await supabase.from('areas').insert({ nome, frente_id: frenteId });
    if (error) {
      console.error('[NewSetorModal]', error.message);
      notify('error', 'Erro ao criar setor');
      return;
    }
    notify('success', 'Setor criado');
    setNome('');
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Setor" width="sm">
      <div className="space-y-4">
        <Input label="Nome do Setor" value={nome} onChange={setNome} placeholder="Ex: BackOffice" required />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar Setor</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditSetorModal({ setor, onClose, onDone }: { setor: Area | null; onClose: () => void; onDone: () => void }) {
  const [nome, setNome] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    if (setor) setNome(setor.nome);
  }, [setor]);

  async function handleSubmit() {
    if (!nome || !setor) return;
    const { error } = await supabase.from('areas').update({ nome }).eq('id', setor.id);
    if (error) {
      console.error('[EditSetorModal]', error.message);
      notify('error', 'Erro ao salvar setor');
      return;
    }
    notify('success', 'Setor atualizado');
    onClose();
    onDone();
  }

  return (
    <Modal open={!!setor} onClose={onClose} title="Editar Setor" width="sm">
      <div className="space-y-4">
        <Input label="Nome do Setor" value={nome} onChange={setNome} placeholder="Ex: BackOffice" required />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </div>
      </div>
    </Modal>
  );
}

function NewProcessoModal({
  open, onClose, frenteId, setores, stakeholders, clientes, onDone,
}: {
  open: boolean;
  onClose: () => void;
  frenteId: string | null;
  setores: Area[];
  stakeholders: Stakeholder[];
  clientes: Cliente[];
  onDone: () => void;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [smeId, setSmeId] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [objetivo, setObjetivo] = useState('');
  const [escopo, setEscopo] = useState('');
  const [caminhoAnexo, setCaminhoAnexo] = useState('');
  const [volumetria, setVolumetria] = useState('');
  const [saving, setSaving] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    if (open) {
      setNome(''); setDescricao(''); setClienteId(''); setAreaId(''); setResponsavelId(''); setSmeId('');
      setPrioridade('media'); setObjetivo(''); setEscopo(''); setCaminhoAnexo(''); setVolumetria(''); setSaving('');
    }
  }, [open]);

  async function handleSubmit() {
    if (!nome || !frenteId) return;
    const { data, error } = await supabase.from('processos').insert({
      nome, descricao, frente_id: frenteId,
      cliente_id: clienteId || null,
      area_id: areaId || null,
      responsavel_id: responsavelId || null,
      sme: smeId || null,
      objetivo: objetivo || null,
      escopo: escopo || null,
      caminho_anexo: caminhoAnexo || null,
      volumetria: volumetria || null,
      saving: saving || null,
      prioridade,
      etapa: 'coleta',
      status: 'em_andamento',
    }).select().single();
    if (error) {
      console.error('[NewProcessoModal]', error.message);
      notify('error', 'Erro ao criar processo');
      return;
    }
    if (data) {
      await supabase.from('timeline_events').insert({
        processo_id: data.id, titulo: 'Processo criado', tipo: 'criacao',
        descricao: 'Processo registrado no sistema.',
      });
    }
    notify('success', 'Processo criado');
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Processo" width="lg">
      <div className="space-y-4">
        <Input label="Nome do Processo" value={nome} onChange={setNome} placeholder="Ex: Amortização de Notas de Crédito" required />
        <div className="grid grid-cols-2 gap-4">
          <TextArea label="Objetivo" value={objetivo} onChange={setObjetivo} placeholder="Qual o objetivo deste processo?" rows={2} />
          <TextArea label="Escopo" value={escopo} onChange={setEscopo} placeholder="O que está dentro do escopo?" rows={2} />
        </div>
        <Input label="Caminho do Anexo" value={caminhoAnexo} onChange={setCaminhoAnexo} placeholder="C:\\Users\\...\\documento.pdf" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Setor" value={areaId} onChange={setAreaId}
            options={[{ value: '', label: 'Selecione...' }, ...setores.map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="Cliente" value={clienteId} onChange={setClienteId}
            options={[{ value: '', label: 'Selecione...' }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]} />
          <Select label="Responsável" value={responsavelId} onChange={setResponsavelId}
            options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="SME" value={smeId} onChange={setSmeId}
            options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="Prioridade" value={prioridade} onChange={setPrioridade}
            options={PRIORIDADES.map((p) => ({ value: p.value, label: p.label }))} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Volumetria" value={volumetria} onChange={setVolumetria} placeholder="Ex: 500 docs/mês" />
          <Input label="Saving" value={saving} onChange={setSaving} placeholder="Ex: 40h/mês" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar Processo</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditProcessoModal({
  processo, onClose, stakeholders, clientes, setores, onDone,
}: {
  processo: Processo | null;
  onClose: () => void;
  stakeholders: Stakeholder[];
  clientes: Cliente[];
  setores: Area[];
  onDone: () => void;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [smeId, setSmeId] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [status, setStatus] = useState('em_andamento');
  const [objetivo, setObjetivo] = useState('');
  const [escopo, setEscopo] = useState('');
  const [caminhoAnexo, setCaminhoAnexo] = useState('');
  const [volumetria, setVolumetria] = useState('');
  const [saving, setSaving] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    if (processo) {
      setNome(processo.nome);
      setDescricao(processo.descricao || '');
      setClienteId(processo.cliente_id || '');
      setAreaId(processo.area_id || '');
      setResponsavelId(processo.responsavel_id || '');
      setSmeId(processo.sme || '');
      setPrioridade(processo.prioridade);
      setStatus(processo.status);
      setObjetivo(processo.objetivo || '');
      setEscopo(processo.escopo || '');
      setCaminhoAnexo(processo.caminho_anexo || '');
      setVolumetria(processo.volumetria || '');
      setSaving(processo.saving || '');
    }
  }, [processo]);

  async function handleSubmit() {
    if (!nome || !processo) return;
    const { error } = await supabase.from('processos').update({
      nome, descricao,
      cliente_id: clienteId || null,
      area_id: areaId || null,
      responsavel_id: responsavelId || null,
      sme: smeId || null,
      objetivo: objetivo || null,
      escopo: escopo || null,
      caminho_anexo: caminhoAnexo || null,
      volumetria: volumetria || null,
      saving: saving || null,
      prioridade, status,
    }).eq('id', processo.id);
    if (error) {
      console.error('[EditProcessoModal]', error.message);
      notify('error', 'Erro ao salvar processo');
      return;
    }
    notify('success', 'Processo atualizado');
    onClose();
    onDone();
  }

  if (!processo) return null;

  return (
    <Modal open={!!processo} onClose={onClose} title="Editar Processo" width="lg">
      <div className="space-y-4">
        <Input label="Nome do Processo" value={nome} onChange={setNome} required />
        <div className="grid grid-cols-2 gap-4">
          <TextArea label="Objetivo" value={objetivo} onChange={setObjetivo} rows={2} />
          <TextArea label="Escopo" value={escopo} onChange={setEscopo} rows={2} />
        </div>
        <Input label="Caminho do Anexo" value={caminhoAnexo} onChange={setCaminhoAnexo} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Setor" value={areaId} onChange={setAreaId}
            options={[{ value: '', label: 'Selecione...' }, ...setores.filter((s) => s.frente_id === processo.frente_id).map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="Cliente" value={clienteId} onChange={setClienteId}
            options={[{ value: '', label: 'Selecione...' }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]} />
          <Select label="Responsável" value={responsavelId} onChange={setResponsavelId}
            options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="SME" value={smeId} onChange={setSmeId}
            options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
          <Select label="Prioridade" value={prioridade} onChange={setPrioridade}
            options={PRIORIDADES.map((p) => ({ value: p.value, label: p.label }))} />
          <Select label="Status" value={status} onChange={setStatus}
            options={STATUS_PROCESSO.map((s) => ({ value: s.value, label: s.label }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Volumetria" value={volumetria} onChange={setVolumetria} />
          <Input label="Saving" value={saving} onChange={setSaving} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </div>
      </div>
    </Modal>
  );
}
