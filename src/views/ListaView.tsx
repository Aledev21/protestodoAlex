import { useState, useMemo } from 'react';
import { Search, ChevronRight, Filter } from 'lucide-react';
import { Processo } from '../lib/types';
import { Card, Badge, Select, EmptyState } from '../components/ui';
import { getEtapaLabel, getStatusLabel, getPrioridadeLabel, STATUS_PROCESSO, PRIORIDADES } from '../lib/constants';

export default function ListaView({
  processos,
  loading,
  onOpenProcesso,
}: {
  processos: Processo[];
  loading: boolean;
  onOpenProcesso: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  const filtered = useMemo(() => {
    let result = processos;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        [p.nome, p.descricao, p.cliente?.nome, p.frente?.nome, p.responsavel?.nome]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter);
    if (prioridadeFilter !== 'all') result = result.filter((p) => p.prioridade === prioridadeFilter);
    result = [...result].sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'prazo') {
        const aDate = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
        const bDate = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
        return aDate - bDate;
      }
      if (sortBy === 'prioridade') {
        const order = ['critica', 'alta', 'media', 'baixa'];
        return order.indexOf(a.prioridade) - order.indexOf(b.prioridade);
      }
      return 0;
    });
    return result;
  }, [processos, search, statusFilter, prioridadeFilter, sortBy]);

  if (loading) return <div className="flex h-full items-center justify-center text-tertiary">Carregando...</div>;

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">Lista de Processos</h1>
        <p className="mt-1 text-sm text-tertiary">{filtered.length} de {processos.length} processos</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-default bg-surface py-2 pl-9 pr-3 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
          />
        </div>
        <Select value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'all', label: 'Todos os status' }, ...STATUS_PROCESSO.map((s) => ({ value: s.value, label: s.label }))]} />
        <Select value={prioridadeFilter} onChange={setPrioridadeFilter}
          options={[{ value: 'all', label: 'Todas as prioridades' }, ...PRIORIDADES.map((p) => ({ value: p.value, label: p.label }))]} />
        <Select value={sortBy} onChange={setSortBy}
          options={[
            { value: 'updated', label: 'Mais recentes' },
            { value: 'created', label: 'Data de criação' },
            { value: 'prazo', label: 'Prazo' },
            { value: 'prioridade', label: 'Prioridade' },
          ]} />
      </div>

      <Card className="overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_120px_140px_100px_40px] gap-4 border-b border-subtle px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
          <span>Processo</span>
          <span>Frente</span>
          <span>Status</span>
          <span>Etapa</span>
          <span>Automações</span>
          <span></span>
        </div>
        {/* Rows */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenProcesso(p.id)}
              className="group grid w-full grid-cols-[1fr_120px_120px_140px_100px_40px] items-center gap-4 px-5 py-3 text-left hover:bg-hover-state transition-colors"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                <p className="text-xs text-tertiary">{p.cliente?.nome} · {p.responsavel?.nome || 'Sem responsável'}</p>
              </div>
              <span className="text-xs text-secondary truncate" style={{ color: p.frente?.cor || undefined }}>
                {p.frente?.nome || '—'}
              </span>
              <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                {getStatusLabel(p.status)}
              </Badge>
              <span className="text-xs text-secondary truncate">{getEtapaLabel(p.etapa)}</span>
              <span className="text-xs text-tertiary">{p.cliente?.nome || '—'}</span>
              <ChevronRight className="h-4 w-4 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <EmptyState icon={Filter} title="Nenhum processo encontrado" description="Ajuste os filtros para ver resultados" />
        )}
      </Card>
    </div>
  );
}
