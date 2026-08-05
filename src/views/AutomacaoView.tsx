import { useState } from 'react';
import { ArrowLeft, Layers, Plus, Check, Trash2, GitBranch, AlertCircle, FileText, User } from 'lucide-react';
import { useAutomacao, useTimeline, usePendencias, useChecklist, useStakeholders } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Card, Badge, Button, Select, Input, ProgressBar, EmptyState, Avatar } from '../components/ui';
import { STATUS_AUTOMACAO, TIPOS_AUTOMACAO, getStatusLabel } from '../lib/constants';

export default function AutomacaoView({ automacaoId, onBack }: { automacaoId: string; onBack: () => void }) {
  const { automacao, loading, setAutomacao } = useAutomacao(automacaoId);
  const { events: timeline } = useTimeline(null, automacaoId);
  const { pendencias, setPendencias } = usePendencias(null, automacaoId);
  const { items: checklist, setItems: setChecklist } = useChecklist(null, automacaoId);
  const { stakeholders } = useStakeholders();
  const [newChecklist, setNewChecklist] = useState('');
  const { notify } = useToast();

  if (loading) return <div className="flex h-full items-center justify-center text-tertiary">Carregando...</div>;
  if (!automacao) return <div className="flex h-full items-center justify-center text-tertiary">Automação não encontrada</div>;

  async function update(field: string, value: any) {
    setAutomacao({ ...automacao!, [field]: value });
    const { error } = await supabase.from('automacoes').update({ [field]: value }).eq('id', automacao!.id);
    if (error) {
      console.error('[AutomacaoView:update]', error.message);
      notify('error', 'Erro ao atualizar automação');
      setAutomacao({ ...automacao!, [field]: (automacao as any)[field] });
    }
  }

  async function toggleCheck(id: string, current: boolean) {
    const { error } = await supabase.from('checklist_items').update({ concluido: !current }).eq('id', id);
    if (error) { console.error('[AutomacaoView:toggleCheck]', error.message); notify('error', 'Erro ao atualizar item'); return; }
    setChecklist(checklist.map((c) => c.id === id ? { ...c, concluido: !current } : c));
  }

  async function addCheck() {
    if (!newChecklist.trim()) return;
    const { data, error } = await supabase.from('checklist_items').insert({
      automacao_id: automacao!.id, texto: newChecklist, ordem: checklist.length,
    }).select().single();
    if (error) { console.error('[AutomacaoView:addCheck]', error.message); notify('error', 'Erro ao adicionar item'); return; }
    if (data) setChecklist([...checklist, data]);
    setNewChecklist('');
  }

  async function deleteCheck(id: string) {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) { console.error('[AutomacaoView:deleteCheck]', error.message); notify('error', 'Erro ao excluir item'); return; }
    setChecklist(checklist.filter((c) => c.id !== id));
  }

  const activePendencias = pendencias.filter((p) => !p.resolvida);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-subtle bg-surface px-8 py-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs text-tertiary hover:text-secondary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao processo
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 text-xs text-tertiary">
              <Layers className="h-3.5 w-3.5" />
              <span>Automação · {(automacao as any).processo?.nome}</span>
            </div>
            <h1 className="text-xl font-semibold text-primary">{automacao.nome}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={automacao.status} onChange={(v) => update('status', v)}
              options={STATUS_AUTOMACAO.map((s) => ({ value: s.value, label: s.label }))} />
            <Select value={automacao.tipo} onChange={(v) => update('tipo', v)}
              options={TIPOS_AUTOMACAO.map((t) => ({ value: t, label: t }))} />
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Progress */}
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary">Progresso</h3>
                <span className="text-2xl font-bold text-blue-400">{automacao.progresso}%</span>
              </div>
              <ProgressBar value={automacao.progresso} className="h-2.5" />
              <div className="mt-4 flex gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button key={v} onClick={() => update('progresso', v)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                      automacao.progresso === v ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-subtle text-tertiary hover:border-default'
                    }`}>
                    {v}%
                  </button>
                ))}
              </div>
            </Card>

            {/* Documentation */}
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-tertiary" />
                <h3 className="text-sm font-semibold text-primary">Documentação</h3>
              </div>
              <textarea
                value={automacao.documentacao || ''}
                onChange={(e) => update('documentacao', e.target.value)}
                placeholder="Documentação técnica da automação..."
                rows={4}
                className="w-full resize-none rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-blue-500 focus:outline-none"
              />
            </Card>

            {/* Checklist */}
            <Card>
              <div className="border-b border-subtle px-5 py-3">
                <h3 className="text-sm font-semibold text-primary">Checklist</h3>
              </div>
              <div className="p-3">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-hover-state group">
                    <button onClick={() => toggleCheck(item.id, item.concluido)}
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        item.concluido ? 'border-blue-500 bg-blue-500 text-white' : 'border-default'
                      }`}>
                      {item.concluido && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.concluido ? 'text-tertiary line-through' : 'text-secondary'}`}>{item.texto}</span>
                    <button onClick={() => deleteCheck(item.id)} className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="mt-2 flex gap-2 px-2">
                  <input value={newChecklist} onChange={(e) => setNewChecklist(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCheck()}
                    placeholder="Novo item..." className="flex-1 rounded-lg border border-default bg-elevated px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                  <Button size="sm" onClick={addCheck}>Add</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-primary">Detalhes</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-tertiary" />
                  <span className="text-secondary">Responsável:</span>
                  <span className="ml-auto text-primary">{automacao.responsavel?.nome || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-tertiary" />
                  <span className="text-secondary">Sprint:</span>
                  <span className="ml-auto text-primary">{automacao.sprint || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-tertiary" />
                  <span className="text-secondary">Tipo:</span>
                  <Badge color="blue" className="ml-auto">{automacao.tipo}</Badge>
                </div>
              </div>
              <div className="mt-4">
                <Select label="Responsável" value={automacao.responsavel_id || ''} onChange={(v) => update('responsavel_id', v || null)}
                  options={[{ value: '', label: 'Sem responsável' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
              </div>
              <div className="mt-3">
                <Input label="Sprint" value={automacao.sprint || ''} onChange={(v) => update('sprint', v)} placeholder="Sprint 15" />
              </div>
            </Card>

            <Card>
              <div className="border-b border-subtle px-5 py-3">
                <h3 className="text-sm font-semibold text-primary">Pendências ({activePendencias.length})</h3>
              </div>
              <div className="p-4 space-y-2">
                {pendencias.map((p) => (
                  <div key={p.id} className={`flex items-start gap-2 ${p.resolvida ? 'opacity-50' : ''}`}>
                    <AlertCircle className={`mt-0.5 h-3.5 w-3.5 ${p.tipo === 'bloqueio' ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className={`text-xs ${p.resolvida ? 'text-tertiary line-through' : 'text-secondary'}`}>{p.descricao}</span>
                  </div>
                ))}
                {pendencias.length === 0 && <p className="text-xs text-tertiary">Nenhuma pendência</p>}
              </div>
            </Card>

            <Card>
              <div className="border-b border-subtle px-5 py-3">
                <h3 className="text-sm font-semibold text-primary">Timeline</h3>
              </div>
              <div className="p-4 space-y-3">
                {timeline.map((e) => (
                  <div key={e.id} className="text-xs">
                    <p className="text-secondary">{e.titulo}</p>
                    <p className="text-tertiary">{new Date(e.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
                {timeline.length === 0 && <p className="text-xs text-tertiary">Sem eventos</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
