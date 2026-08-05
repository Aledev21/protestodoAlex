import { useState } from 'react';
import { Search, X, FileText, User, Building2, Layers, AlertCircle, Clock } from 'lucide-react';
import { Processo, Frente } from '../lib/types';
import { getStatusLabel, getEtapaLabel, getPrioridadeLabel } from '../lib/constants';

export default function SearchModal({
  open,
  onClose,
  processos,
  frentes,
  onOpenProcesso,
}: {
  open: boolean;
  onClose: () => void;
  processos: Processo[];
  frentes: Frente[];
  onOpenProcesso: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? processos.filter((p) => {
        const haystack = [
          p.nome, p.descricao, p.objetivo, p.escopo,
          p.cliente?.nome, p.area?.nome, p.responsavel?.nome,
          p.frente?.nome, p.status, p.etapa,
          ...(p.processo_stakeholders?.map((ps) => ps.stakeholder?.nome) || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
    : [];

  const frenteResults = q
    ? frentes.filter((f) => f.nome.toLowerCase().includes(q) || (f.descricao || '').toLowerCase().includes(q))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh] animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-default bg-surface shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-subtle px-4 py-3">
          <Search className="h-4 w-4 text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar processo, cliente, responsável, frente..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary focus:outline-none"
          />
          <button onClick={onClose} className="text-tertiary hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {q && results.length === 0 && frenteResults.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-tertiary">Nenhum resultado para "{query}"</p>
          )}

          {!q && (
            <p className="px-3 py-8 text-center text-sm text-tertiary">Digite para pesquisar em todos os processos</p>
          )}

          {frenteResults.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">Frentes</p>
              {frenteResults.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-secondary hover:bg-hover-state">
                  <Layers className="h-4 w-4 text-tertiary" />
                  {f.nome}
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">Processos ({results.length})</p>
              {results.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenProcesso(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-hover-state transition-colors"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 text-tertiary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-primary">{p.nome}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-tertiary">
                      {p.frente && <span>{p.frente.nome}</span>}
                      {p.cliente && <span>· {p.cliente.nome}</span>}
                      <span>· {getEtapaLabel(p.etapa)}</span>
                    </div>
                  </div>
                  {p.status === 'bloqueado' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
