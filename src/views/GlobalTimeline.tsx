import { useMemo, useState } from 'react';
import { GitBranch, ChevronRight, Calendar } from 'lucide-react';
import { Processo } from '../lib/types';
import { Card, Badge, Select, EmptyState } from '../components/ui';
import { getStatusLabel } from '../lib/constants';

export default function GlobalTimeline({
  processos,
  onOpenProcesso,
}: {
  processos: Processo[];
  onOpenProcesso: (id: string) => void;
}) {
  const [frenteFilter, setFrenteFilter] = useState('all');

  const sortedByDate = useMemo(() => {
    let result = processos;
    if (frenteFilter !== 'all') result = result.filter((p) => p.frente_id === frenteFilter);
    return [...result].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [processos, frenteFilter]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Processo[]> = {};
    sortedByDate.forEach((p) => {
      const d = new Date(p.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sortedByDate]);

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const frentes = useMemo(() => {
    const map = new Map(processos.map((p) => [p.frente?.id, p.frente?.nome]).filter((f): f is [string, string] => !!f[0] && !!f[1]));
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [processos]);

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Timeline Global</h1>
          <p className="mt-1 text-sm text-tertiary">Todos os processos ordenados por atividade recente</p>
        </div>
        <Select value={frenteFilter} onChange={setFrenteFilter}
          options={[{ value: 'all', label: 'Todas as frentes' }, ...frentes.map((f) => ({ value: f.id, label: f.nome }))]} />
      </div>

      {groupedByMonth.length === 0 && (
        <EmptyState icon={GitBranch} title="Nenhum processo" description="Os processos aparecerão aqui" />
      )}

      <div className="space-y-8">
        {groupedByMonth.map(([monthKey, items]) => {
          const [year, month] = monthKey.split('-');
          return (
            <div key={monthKey}>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-tertiary" />
                <h2 className="text-sm font-semibold text-secondary">{MONTHS[parseInt(month)]} {year}</h2>
                <span className="text-xs text-tertiary">· {items.length} processo(s)</span>
              </div>
              <Card className="divide-y divide-[var(--border-subtle)]">
                {items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProcesso(p.id)}
                    className="group flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-hover-state transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.frente?.cor || '#3b82f6' }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                      <p className="text-xs text-tertiary">
                        {p.frente?.nome} · Atualizado em {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge color={p.status === 'bloqueado' ? 'red' : p.status === 'concluido' ? 'green' : 'blue'}>
                      {getStatusLabel(p.status)}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
