import { useMemo, useState, useCallback, DragEvent } from 'react';
import { ChevronRight, Layers, RefreshCw } from 'lucide-react';
import { Processo } from '../lib/types';
import { Badge } from '../components/ui';
import { useToast } from '../components/Toast';
import {
  getEtapaLabel, getStatusLabel, getEtapaIndex,
  ETAPAS_PROCESSO, STATUS_PROCESSO, PRIORIDADES,
} from '../lib/constants';
import { supabase } from '../lib/supabase';

export default function KanbanView({
  processos,
  loading,
  onOpenProcesso,
  onProcessoMoved,
}: {
  processos: Processo[];
  loading: boolean;
  onOpenProcesso: (id: string) => void;
  onProcessoMoved: () => void;
}) {
  const { notify } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // local override so the card moves instantly before refetch
  const [override, setOverride] = useState<Record<string, string>>({});

  const columns = useMemo(() => {
    return ETAPAS_PROCESSO.map((etapa) => ({
      ...etapa,
      items: processos
        .filter((p) => (override[p.id] ?? p.etapa) === etapa.value)
        .sort((a, b) => getEtapaIndex(override[a.id] ?? a.etapa) - getEtapaIndex(override[b.id] ?? b.etapa)),
    }));
  }, [processos, override]);

  const handleDragStart = useCallback((e: DragEvent<HTMLButtonElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) setDragOverCol(col);
  }, [dragOverCol]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>, newEtapa: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setDragId(null);
    setDragOverCol(null);
    if (!id) return;

    const processo = processos.find((p) => p.id === id);
    if (!processo) return;
    const oldEtapa = override[processo.id] ?? processo.etapa;
    if (oldEtapa === newEtapa) return;

    // optimistic: move card immediately
    setOverride((prev) => ({ ...prev, [id]: newEtapa }));
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('processos')
        .update({ etapa: newEtapa })
        .eq('id', id);
      if (updateError) throw updateError;

      await supabase.from('timeline_events').insert({
        processo_id: id,
        titulo: 'Etapa alterada',
        tipo: 'etapa',
        descricao: `De: ${getEtapaLabel(oldEtapa)}\nPara: ${getEtapaLabel(newEtapa)}`,
      });

      notify('success', `Processo movido para "${getEtapaLabel(newEtapa)}"`);
      onProcessoMoved();
    } catch (err: any) {
      console.error('[KanbanView:drop]', err?.message);
      notify('error', 'Erro ao mover processo. Tente novamente.');
      // revert optimistic update
      setOverride((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setSaving(false);
    }
  }, [processos, override, dragId, notify, onProcessoMoved]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-tertiary">Carregando...</div>;
  }

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="border-b border-subtle px-8 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-primary">Kanban</h1>
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-tertiary">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Salvando...
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-tertiary">Arraste os cards entre as colunas para alterar a etapa</p>
      </div>

      <div className="flex-1 overflow-x-auto px-8 py-6">
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
          {columns.map((col) => {
            const isDropTarget = dragOverCol === col.value;
            return (
              <div key={col.value} className="flex w-72 flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{col.label}</span>
                    <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-tertiary">{col.items.length}</span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-tertiary">{col.group}</span>
                </div>
                <div
                  onDragOver={(e) => handleDragOver(e, col.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.value)}
                  className={`flex-1 space-y-2 overflow-y-auto rounded-xl p-2 transition-all duration-200 ${
                    isDropTarget
                      ? 'bg-brand-primary/10 ring-2 ring-brand-primary/40 scale-[1.01]'
                      : 'bg-surface/50'
                  }`}
                >
                  {col.items.map((p) => {
                    const isDragging = dragId === p.id;
                    return (
                      <button
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onOpenProcesso(p.id)}
                        className={`group w-full rounded-lg border border-subtle bg-surface p-3 text-left transition-all hover:border-default hover:shadow-lg animate-slide-up ${
                          isDragging ? 'opacity-40 scale-[0.98] shadow-xl' : ''
                        }`}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      >
                        <p className="text-sm font-medium text-primary line-clamp-2">{p.nome}</p>
                        <p className="mt-1 text-xs text-tertiary">{p.frente?.nome}</p>
                        {p.automacoes && p.automacoes.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-tertiary">
                            <Layers className="h-3 w-3" />
                            {p.automacoes.length} automação(ões)
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                            {getStatusLabel(p.status)}
                          </Badge>
                          <Badge color={PRIORIDADES.find((pr) => pr.value === p.prioridade)?.color}>
                            {p.prioridade}
                          </Badge>
                        </div>
                        {p.data_criacao && (
                          <p className="mt-2 text-[11px] text-tertiary">
                            Criado: {new Date(p.data_criacao).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                  {col.items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-subtle py-8 text-center">
                      <p className="text-xs text-tertiary">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
