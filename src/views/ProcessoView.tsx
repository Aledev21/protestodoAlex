import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Check, MessageSquare, Paperclip,
  AlertCircle, Clock, HelpCircle, Link2, OctagonAlert, Users,
  Layers, FileText, Target, GitBranch, Calendar, ChevronRight, X,
  Archive, ArchiveRestore, MoreVertical, AlertOctagon, Edit3, Save, FolderOpen,
} from 'lucide-react';
import { useProcesso, useTimeline, usePendencias, useChecklist, useComentarios, useAnexos, useStakeholders } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Card, Badge, Button, Modal, Input, TextArea, Select, Avatar, ProgressBar, EmptyState } from '../components/ui';
import {
  ETAPAS_PROCESSO, STATUS_PROCESSO, PRIORIDADES, TIPOS_PENDENCIA, AGUARDANDO_QUEM,
  PAPEIS_STAKEHOLDER, PAPEIS_DESTAQUE,
  getEtapaLabel, getStatusLabel, getPrioridadeLabel, getEtapaIndex,
} from '../lib/constants';
import { Pendencia, Automacao, Stakeholder } from '../lib/types';

const PENDENCIA_ICONS: Record<string, any> = {
  pendencia: AlertCircle, bloqueio: OctagonAlert, dependencia: Link2, duvida: HelpCircle, aguardando: Clock,
};

export default function ProcessoView({
  processoId,
  onBack,
  onOpenAutomacao,
}: {
  processoId: string;
  onBack: () => void;
  onOpenAutomacao: (id: string) => void;
}) {
  const { processo, loading, setProcesso } = useProcesso(processoId);
  const { events: timeline, setEvents } = useTimeline(processoId);
  const { pendencias, setPendencias } = usePendencias(processoId);
  const { items: checklist, setItems: setChecklist } = useChecklist(processoId);
  const { comentarios, setComentarios } = useComentarios(processoId);
  const { anexos } = useAnexos(processoId);
  const { stakeholders } = useStakeholders();

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'pendencias' | 'automacoes' | 'comments'>('overview');
  const [showAddPendencia, setShowAddPendencia] = useState(false);
  const [showAddAutomacao, setShowAddAutomacao] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenAuto, setMenuOpenAuto] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automacao | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notify } = useToast();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenAuto(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-tertiary">Carregando...</div>;
  if (!processo) return <div className="flex h-full items-center justify-center text-tertiary">Processo não encontrado</div>;

  const etapaIdx = getEtapaIndex(processo.etapa);
  const checklistDone = checklist.filter((c) => c.concluido).length;
  const checklistTotal = checklist.length;
  const activePendencias = pendencias.filter((p) => !p.resolvida);

  async function updateProcesso(field: string, value: any) {
    setProcesso({ ...processo!,[field]: value });
    const { error } = await supabase.from('processos').update({ [field]: value }).eq('id', processo!.id);
    if (error) {
      console.error('[updateProcesso]', error.message);
      notify('error', 'Erro ao atualizar processo');
      return;
    }
    // Log to timeline if etapa changed
    if (field === 'etapa') {
      const event = {
        processo_id: processo!.id,
        titulo: `Etapa alterada: ${getEtapaLabel(value)}`,
        tipo: 'etapa',
        descricao: `Processo movido para "${getEtapaLabel(value)}".`,
      };
      await supabase.from('timeline_events').insert(event);
      const { data, error: tlErr } = await supabase.from('timeline_events').select('*').eq('processo_id', processo!.id).order('created_at', { ascending: false }).limit(1).single();
      if (tlErr) console.error('[updateProcesso:timeline]', tlErr.message);
      if (data) setEvents([data, ...timeline]);
    }
  }

  async function toggleChecklistItem(id: string, current: boolean) {
    const { error } = await supabase.from('checklist_items').update({ concluido: !current }).eq('id', id);
    if (error) { console.error('[toggleChecklistItem]', error.message); notify('error', 'Erro ao atualizar item'); return; }
    setChecklist(checklist.map((c) => c.id === id ? { ...c, concluido: !current } : c));
  }

  async function addChecklistItem() {
    if (!newChecklistText.trim()) return;
    const { data, error } = await supabase.from('checklist_items').insert({
      processo_id: processo!.id,
      texto: newChecklistText,
      ordem: checklist.length,
    }).select().single();
    if (error) { console.error('[addChecklistItem]', error.message); notify('error', 'Erro ao adicionar item'); return; }
    if (data) setChecklist([...checklist, data]);
    setNewChecklistText('');
    setShowAddChecklist(false);
  }

  async function removeChecklistItem(id: string) {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) { console.error('[removeChecklistItem]', error.message); notify('error', 'Erro ao remover item'); return; }
    setChecklist(checklist.filter((c) => c.id !== id));
  }

  async function upsertProcessoStakeholder(papel: string, stakeholderId: string | null) {
    if (!stakeholderId) {
      // remove o vínculo
      const existing = processo!.processo_stakeholders?.find((ps) => ps.papel === papel);
      if (existing) {
        const { error } = await supabase.from('processo_stakeholders').delete().eq('id', existing.id);
        if (error) { console.error('[upsertProcessoStakeholder]', error.message); notify('error', 'Erro ao remover'); return; }
        setProcesso({ ...processo!, processo_stakeholders: processo!.processo_stakeholders?.filter((ps) => ps.id !== existing.id) });
      }
      return;
    }
    const existing = processo!.processo_stakeholders?.find((ps) => ps.papel === papel);
    if (existing) {
      const { error } = await supabase.from('processo_stakeholders').update({ stakeholder_id: stakeholderId }).eq('id', existing.id);
      if (error) { console.error('[upsertProcessoStakeholder]', error.message); notify('error', 'Erro ao atualizar'); return; }
      setProcesso({
        ...processo!,
        processo_stakeholders: processo!.processo_stakeholders?.map((ps) => ps.id === existing.id ? { ...ps, stakeholder_id: stakeholderId, stakeholder: stakeholders.find((s) => s.id === stakeholderId) } : ps),
      });
    } else {
      const { data, error } = await supabase.from('processo_stakeholders').insert({
        processo_id: processo!.id, papel, stakeholder_id: stakeholderId,
      }).select('*, stakeholder:stakeholders(*)').single();
      if (error) { console.error('[upsertProcessoStakeholder]', error.message); notify('error', 'Erro ao vincular'); return; }
      if (data) {
        setProcesso({ ...processo!, processo_stakeholders: [...(processo!.processo_stakeholders || []), data] });
        await supabase.from('timeline_events').insert({
          processo_id: processo!.id,
          titulo: `Pessoa adicionada como ${papel.toUpperCase()}`,
          tipo: 'evento',
          descricao: data.stakeholder?.nome ?? '',
        });
      }
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;
    const { data, error } = await supabase.from('comentarios').insert({
      processo_id: processo!.id,
      autor: 'Você (Analista)',
      texto: newComment,
    }).select().single();
    if (error) { console.error('[addComment]', error.message); notify('error', 'Erro ao adicionar comentário'); return; }
    if (data) setComentarios([data, ...comentarios]);
    // Also log to timeline
    await supabase.from('timeline_events').insert({
      processo_id: processo!.id,
      titulo: 'Novo comentário',
      tipo: 'comentario',
      descricao: newComment.slice(0, 100),
    });
    setNewComment('');
  }

  async function togglePendencia(p: Pendencia) {
    const { error } = await supabase.from('pendencias').update({
      resolvida: !p.resolvida,
      data_resolucao: !p.resolvida ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', p.id);
    if (error) { console.error('[togglePendencia]', error.message); notify('error', 'Erro ao atualizar pendência'); return; }
    setPendencias(pendencias.map((pp) => pp.id === p.id ? { ...pp, resolvida: !pp.resolvida } : pp));
  }

  async function deletePendencia(id: string) {
    const { error } = await supabase.from('pendencias').delete().eq('id', id);
    if (error) { console.error('[deletePendencia]', error.message); notify('error', 'Erro ao excluir pendência'); return; }
    setPendencias(pendencias.filter((p) => p.id !== id));
  }

  async function archiveAutomacao(auto: Automacao) {
    const newVal = !auto.arquivado;
    const { error } = await supabase.from('automacoes').update({ arquivado: newVal }).eq('id', auto.id);
    if (error) { console.error('[archiveAutomacao]', error.message); notify('error', 'Erro ao arquivar automação'); return; }
    setProcesso({
      ...processo!,
      automacoes: processo!.automacoes?.map((a) => a.id === auto.id ? { ...a, arquivado: newVal } : a),
    });
    await supabase.from('timeline_events').insert({
      processo_id: processo!.id,
      titulo: newVal ? `Automação arquivada: ${auto.nome}` : `Automação desarquivada: ${auto.nome}`,
      tipo: 'evento',
      descricao: newVal ? `A automação "${auto.nome}" foi arquivada.` : `A automação "${auto.nome}" foi desarquivada.`,
    });
    notify('success', newVal ? 'Automação arquivada' : 'Automação desarquivada');
    setMenuOpenAuto(null);
  }

  async function deleteAutomacao(auto: Automacao) {
    const { error } = await supabase.from('automacoes').delete().eq('id', auto.id);
    if (error) { console.error('[deleteAutomacao]', error.message); notify('error', 'Erro ao excluir automação'); return; }
    setProcesso({
      ...processo!,
      automacoes: processo!.automacoes?.filter((a) => a.id !== auto.id),
    });
    await supabase.from('timeline_events').insert({
      processo_id: processo!.id,
      titulo: `Automação excluída: ${auto.nome}`,
      tipo: 'evento',
      descricao: `A automação "${auto.nome}" foi excluída permanentemente.`,
    });
    notify('success', 'Automação excluída');
    setDeleteTarget(null);
  }

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral', icon: FileText },
    { id: 'timeline' as const, label: 'Timeline', icon: GitBranch, count: timeline.length },
    { id: 'pendencias' as const, label: 'Pendências', icon: AlertCircle, count: activePendencias.length },
    { id: 'automacoes' as const, label: 'Automações', icon: Layers, count: processo.automacoes?.length || 0 },
    { id: 'comments' as const, label: 'Comentários', icon: MessageSquare, count: comentarios.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-subtle bg-surface px-8 py-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs text-tertiary hover:text-secondary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 text-xs text-tertiary">
              <span style={{ color: processo.frente?.cor || '#3b82f6' }}>{processo.frente?.nome}</span>
              <ChevronRight className="h-3 w-3" />
              <span>{processo.cliente?.nome || 'Sem cliente'}</span>
            </div>
            <h1 className="text-xl font-semibold text-primary">{processo.nome}</h1>
            {processo.descricao && <p className="mt-1 text-sm text-secondary">{processo.descricao}</p>}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Select
              value={processo.status}
              onChange={(v) => updateProcesso('status', v)}
              options={STATUS_PROCESSO.map((s) => ({ value: s.value, label: s.label }))}
            />
            <Select
              value={processo.prioridade}
              onChange={(v) => updateProcesso('prioridade', v)}
              options={PRIORIDADES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="border-b border-subtle bg-surface px-8 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-secondary">Etapa atual: {getEtapaLabel(processo.etapa)}</span>
          <span className="text-xs text-tertiary">{etapaIdx + 1} de {ETAPAS_PROCESSO.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {ETAPAS_PROCESSO.map((etapa, idx) => (
            <button
              key={etapa.value}
              onClick={() => updateProcesso('etapa', etapa.value)}
              title={etapa.label}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx <= etapaIdx
                  ? 'bg-blue-500'
                  : 'bg-elevated hover:bg-hover-state'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b border-subtle bg-base px-8">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-blue-500 text-primary font-medium'
                    : 'border-transparent text-tertiary hover:text-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-blue-500/20 text-blue-400' : 'bg-elevated text-tertiary'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Info */}
              <Card className="p-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <EditableField label="Objetivo" value={processo.objetivo} onSave={(v) => updateProcesso('objetivo', v)} multiline />
                    <EditableField label="Escopo" value={processo.escopo} onSave={(v) => updateProcesso('escopo', v)} multiline />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-tertiary">Caminho do Anexo</p>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 flex-shrink-0 text-tertiary" />
                      <EditableField
                        value={processo.caminho_anexo}
                        onSave={(v) => updateProcesso('caminho_anexo', v)}
                        placeholder="C:\\Users\\...\\documento.pdf"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-tertiary">SME</p>
                      <Select
                        value={processo.sme || ''}
                        onChange={(v) => updateProcesso('sme', v || null)}
                        options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]}
                      />
                    </div>
                    <div />
                    <EditableField label="Volumetria" value={processo.volumetria} onSave={(v) => updateProcesso('volumetria', v)} placeholder="Ex: 500 docs/mês" />
                    <EditableField label="Saving" value={processo.saving} onSave={(v) => updateProcesso('saving', v)} placeholder="Ex: 40h/mês" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 border-t border-subtle pt-4">
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-tertiary">Cliente</p>
                      <p className="text-sm text-primary">{processo.cliente?.nome || '—'}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-tertiary">Área</p>
                      <p className="text-sm text-primary">{processo.area?.nome || '—'}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-tertiary">Responsável</p>
                      <p className="text-sm text-primary">{processo.responsavel?.nome || '—'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Checklist */}
              <Card>
                <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-tertiary" />
                    <h3 className="text-sm font-semibold text-primary">Checklist</h3>
                    {checklistTotal > 0 && (
                      <span className="text-xs text-tertiary">{checklistDone}/{checklistTotal}</span>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" icon={Plus} onClick={() => setShowAddChecklist(true)}>Adicionar</Button>
                </div>
                <div className="p-3">
                  {checklist.length === 0 && (
                    <p className="px-2 py-4 text-center text-sm text-tertiary">Nenhum item no checklist</p>
                  )}
                  {checklist.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-hover-state transition-colors">
                      <button
                        onClick={() => toggleChecklistItem(item.id, item.concluido)}
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                          item.concluido ? 'border-blue-500 bg-blue-500 text-white' : 'border-default hover:border-blue-500'
                        }`}
                      >
                        {item.concluido && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`flex-1 text-sm ${item.concluido ? 'text-tertiary line-through' : 'text-secondary'}`}>
                        {item.texto}
                      </span>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-all"
                        title="Remover item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {showAddChecklist && (
                    <div className="mt-2 flex gap-2 px-2">
                      <input
                        autoFocus
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                        placeholder="Novo item..."
                        className="flex-1 rounded-lg border border-default bg-elevated px-3 py-1.5 text-sm text-primary placeholder:text-tertiary focus:border-blue-500 focus:outline-none"
                      />
                      <Button size="sm" onClick={addChecklistItem}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddChecklist(false)}>Cancelar</Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* People — destaque BA / Arquiteto / GP */}
              <Card>
                <div className="border-b border-subtle px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-tertiary" />
                    <h3 className="text-sm font-semibold text-primary">Pessoas Envolvidas</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {PAPEIS_DESTAQUE.map((papel) => {
                    const info = PAPEIS_STAKEHOLDER.find((p) => p.value === papel);
                    const ps = processo.processo_stakeholders?.find((p) => p.papel === papel);
                    return (
                      <div key={papel} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-semibold uppercase tracking-wider text-tertiary">{info?.label.split(' ')[0]}</span>
                        {ps?.stakeholder ? (
                          <>
                            <Avatar name={ps.stakeholder.nome} size="sm" />
                            <span className="text-sm text-primary">{ps.stakeholder.nome}</span>
                          </>
                        ) : (
                          <span className="text-sm text-tertiary italic">— não definido —</span>
                        )}
                        <div className="ml-auto w-48">
                          <Select
                            value={ps?.stakeholder_id || ''}
                            onChange={(v) => upsertProcessoStakeholder(papel, v || null)}
                            options={[{ value: '', label: '...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {processo.processo_stakeholders && processo.processo_stakeholders.length > 0 && (
                    <details className="pt-2 border-t border-subtle">
                      <summary className="cursor-pointer text-xs text-tertiary hover:text-secondary">Outros papéis ({processo.processo_stakeholders.filter((p) => !PAPEIS_DESTAQUE.includes(p.papel as any)).length})</summary>
                      <div className="mt-2 space-y-2">
                        {processo.processo_stakeholders
                          .filter((p) => !PAPEIS_DESTAQUE.includes(p.papel as any))
                          .map((ps) => (
                            <div key={ps.id} className="flex items-center gap-3">
                              <Avatar name={ps.stakeholder?.nome || '?'} size="sm" />
                              <span className="text-sm text-secondary">{ps.stakeholder?.nome}</span>
                              <Badge color="slate" className="ml-auto">{PAPEIS_STAKEHOLDER.find((p) => p.value === ps.papel)?.label ?? ps.papel}</Badge>
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              {/* Quick stats */}
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-primary">Resumo</h3>
                <div className="space-y-3">
                  <StatRow label="Automações" value={processo.automacoes?.length || 0} icon={Layers} />
                  <StatRow label="Pendências ativas" value={activePendencias.length} icon={AlertCircle} color={activePendencias.length > 0 ? 'text-amber-400' : 'text-tertiary'} />
                  <StatRow label="Comentários" value={comentarios.length} icon={MessageSquare} />
                  <StatRow label="Anexos" value={anexos.length} icon={Paperclip} />
                  <StatRow label="Eventos na timeline" value={timeline.length} icon={GitBranch} />
                </div>
              </Card>

              {/* Anexos */}
              <Card>
                <div className="border-b border-subtle px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-tertiary" />
                    <h3 className="text-sm font-semibold text-primary">Anexos</h3>
                  </div>
                </div>
                <div className="p-4">
                  {anexos.length === 0 ? (
                    <p className="text-sm text-tertiary">Nenhum anexo</p>
                  ) : (
                    <div className="space-y-2">
                      {anexos.map((a) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-secondary hover:bg-hover-state">
                          <Paperclip className="h-3.5 w-3.5 text-tertiary" />
                          {a.nome}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mx-auto max-w-2xl">
            <Card className="p-6">
              <h3 className="mb-6 text-sm font-semibold text-primary">Timeline Completa</h3>
              <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:h-full before:w-px before:bg-[var(--border-subtle)]">
                {timeline.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-4">
                    <div className={`relative z-10 mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 ${
                      event.tipo === 'criacao' ? 'border-blue-500 bg-blue-500' :
                      event.tipo === 'etapa' ? 'border-emerald-500 bg-emerald-500' :
                      event.tipo === 'pendencia' ? 'border-amber-500 bg-amber-500' :
                      'border-default bg-surface'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary">{event.titulo}</p>
                      </div>
                      {event.descricao && <p className="mt-0.5 text-xs text-secondary">{event.descricao}</p>}
                      <p className="mt-1 text-[11px] text-tertiary">
                        {new Date(event.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <EmptyState icon={GitBranch} title="Nenhum evento na timeline" description="Os eventos aparecerão aqui automaticamente" />
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'pendencias' && (
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">{activePendencias.length} pendência(s) ativa(s)</p>
              <Button size="sm" icon={Plus} onClick={() => setShowAddPendencia(true)}>Nova Pendência</Button>
            </div>
            {pendencias.map((p) => {
              const tipoInfo = TIPOS_PENDENCIA.find((t) => t.value === p.tipo);
              const Icon = PENDENCIA_ICONS[p.tipo] || AlertCircle;
              return (
                <Card key={p.id} className={`p-4 ${p.resolvida ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg status-${tipoInfo?.color || 'slate'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge color={tipoInfo?.color}>{tipoInfo?.label}</Badge>
                        {p.aguardando_quem && <span className="text-xs text-tertiary">Aguardando: {p.aguardando_quem}</span>}
                        {p.resolvida && <Badge color="green">Resolvida</Badge>}
                      </div>
                      <p className={`mt-2 text-sm ${p.resolvida ? 'text-tertiary line-through' : 'text-secondary'}`}>{p.descricao}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button onClick={() => togglePendencia(p)} title={p.resolvida ? 'Reabrir' : 'Resolver'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary hover:bg-hover-state hover:text-primary">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => deletePendencia(p.id)} title="Excluir"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary hover:bg-hover-state hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {pendencias.length === 0 && (
              <EmptyState icon={AlertCircle} title="Nenhuma pendência" description="Todas as pendências aparecerão aqui" />
            )}
          </div>
        )}

        {activeTab === 'automacoes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-secondary">{processo.automacoes?.filter((a) => !a.arquivado).length || 0} automação(ões) ativa(s)</p>
                {processo.automacoes?.some((a) => a.arquivado) && (
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                      showArchived ? 'bg-blue-500/10 text-blue-400' : 'text-tertiary hover:text-secondary'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}
                    <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px]">{processo.automacoes.filter((a) => a.arquivado).length}</span>
                  </button>
                )}
              </div>
              <Button size="sm" icon={Plus} onClick={() => setShowAddAutomacao(true)}>Nova Automação</Button>
            </div>
            {processo.automacoes?.filter((a) => showArchived || !a.arquivado).map((auto) => (
              <div
                key={auto.id}
                className={`group flex items-center gap-4 rounded-xl border border-subtle bg-surface p-4 transition-colors hover:border-default hover:bg-hover-state ${auto.arquivado ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => onOpenAutomacao(auto.id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Layers className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-primary">{auto.nome}</p>
                      {auto.arquivado && <Badge color="slate">Arquivada</Badge>}
                    </div>
                    <p className="text-xs text-tertiary">{auto.tipo} · {auto.sprint || 'Sem sprint'}</p>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-tertiary">Progresso</span>
                      <span className="text-secondary">{auto.progresso}%</span>
                    </div>
                    <ProgressBar value={auto.progresso} />
                  </div>
                  <Badge color={auto.status === 'concluido' ? 'green' : auto.status === 'bloqueado' ? 'red' : auto.status === 'em_andamento' ? 'blue' : 'slate'} className="flex-shrink-0">
                    {getStatusLabel(auto.status, 'automacao')}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-tertiary opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0" />
                </button>
                <div className="relative flex-shrink-0" ref={menuOpenAuto === auto.id ? menuRef : undefined}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenAuto(menuOpenAuto === auto.id ? null : auto.id); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary opacity-0 transition-opacity hover:bg-hover-state hover:text-primary group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenAuto === auto.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-default bg-surface shadow-2xl animate-scale-in">
                      <button
                        onClick={() => archiveAutomacao(auto)}
                        className="flex w-full items-center gap-2.5 rounded-t-lg px-3 py-2.5 text-sm text-secondary hover:bg-hover-state transition-colors"
                      >
                        {auto.arquivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        {auto.arquivado ? 'Desarquivar' : 'Arquivar'}
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(auto); setMenuOpenAuto(null); }}
                        className="flex w-full items-center gap-2.5 rounded-b-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!processo.automacoes || processo.automacoes.filter((a) => showArchived || !a.arquivado).length === 0) && (
              <EmptyState icon={Layers} title="Nenhuma automação" description="Adicione automações a este processo" />
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex gap-3">
              <Avatar name="Você" size="md" />
              <div className="flex-1">
                <TextArea
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Escreva um comentário..."
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>Comentar</Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {comentarios.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.autor || 'Anônimo'} size="md" />
                  <div className="flex-1">
                    <div className="rounded-xl bg-surface px-4 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{c.autor}</span>
                        <span className="text-[11px] text-tertiary">
                          {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-secondary">{c.texto}</p>
                    </div>
                  </div>
                </div>
              ))}
              {comentarios.length === 0 && (
                <EmptyState icon={MessageSquare} title="Nenhum comentário" description="Inicie a conversa sobre este processo" />
              )}
            </div>
          </div>
        )}
      </div>

      <AddPendenciaModal
        open={showAddPendencia}
        onClose={() => setShowAddPendencia(false)}
        processoId={processo.id}
        onAdd={(p) => { setPendencias([p, ...pendencias]); }}
      />
      <AddAutomacaoModal
        open={showAddAutomacao}
        onClose={() => setShowAddAutomacao(false)}
        processoId={processo.id}
        stakeholders={stakeholders}
        onAdd={(a) => { setProcesso({ ...processo, automacoes: [...(processo.automacoes || []), a] }); }}
      />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir automação" width="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-primary">Tem certeza?</p>
              <p className="mt-1 text-xs text-secondary">
                A automação "{deleteTarget?.nome}" será excluída permanentemente, junto com seu checklist, pendências e timeline. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => deleteTarget && deleteAutomacao(deleteTarget)}>
              Excluir permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-tertiary">{label}</p>
      <p className="mt-0.5 text-sm text-primary">{value || '—'}</p>
    </div>
  );
}

function StatRow({ label, value, icon: Icon, color = 'text-tertiary' }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-secondary">{label}</span>
      <span className="ml-auto font-semibold text-primary">{value}</span>
    </div>
  );
}

function AddPendenciaModal({ open, onClose, processoId, onAdd }: { open: boolean; onClose: () => void; processoId: string; onAdd: (p: Pendencia) => void }) {
  const [tipo, setTipo] = useState('pendencia');
  const [aguardandoQuem, setAguardandoQuem] = useState('');
  const [descricao, setDescricao] = useState('');

  async function handleSubmit() {
    if (!descricao) return;
    const { data, error } = await supabase.from('pendencias').insert({
      processo_id: processoId, tipo, aguardando_quem: aguardandoQuem || null, descricao,
    }).select().single();
    if (error) { console.error('[AddPendenciaModal]', error.message); return; }
    if (data) {
      onAdd(data as Pendencia);
      await supabase.from('timeline_events').insert({
        processo_id: processoId,
        titulo: `Nova ${TIPOS_PENDENCIA.find((t) => t.value === tipo)?.label}`,
        tipo: 'pendencia',
        descricao,
      });
    }
    setDescricao(''); setTipo('pendencia'); setAguardandoQuem('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Pendência">
      <div className="space-y-4">
        <Select label="Tipo" value={tipo} onChange={setTipo} options={TIPOS_PENDENCIA.map((t) => ({ value: t.value, label: t.label }))} />
        <Select label="Aguardando" value={aguardandoQuem} onChange={setAguardandoQuem}
          options={[{ value: '', label: 'Ninguém específico' }, ...AGUARDANDO_QUEM.map((a) => ({ value: a.value, label: a.label }))]} />
        <TextArea label="Descrição" value={descricao} onChange={setDescricao} placeholder="Descreva a pendência..." />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </div>
      </div>
    </Modal>
  );
}

function AddAutomacaoModal({ open, onClose, processoId, stakeholders, onAdd }: {
  open: boolean;
  onClose: () => void;
  processoId: string;
  stakeholders: Stakeholder[];
  onAdd: (a: Automacao) => void;
}) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Performer');
  const [responsavelId, setResponsavelId] = useState('');
  const [sprint, setSprint] = useState('');

  async function handleSubmit() {
    if (!nome) return;
    const { data, error } = await supabase.from('automacoes').insert({
      processo_id: processoId, nome, tipo,
      responsavel_id: responsavelId || null,
      sprint: sprint || null,
      status: 'nao_iniciado', progresso: 0,
    }).select().single();
    if (error) { console.error('[AddAutomacaoModal]', error.message); return; }
    if (data) {
      onAdd(data);
      await supabase.from('timeline_events').insert({
        processo_id: processoId,
        titulo: `Automação criada: ${nome}`,
        tipo: 'evento',
        descricao: `Automação do tipo ${tipo} adicionada.`,
      });
    }
    setNome(''); setTipo('Performer'); setSprint('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Automação">
      <div className="space-y-4">
        <Input label="Nome" value={nome} onChange={setNome} placeholder="Ex: Dispatcher" required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={tipo} onChange={setTipo}
            options={['Dispatcher', 'Performer', 'API', 'IA', 'Outro'].map((t) => ({ value: t, label: t }))} />
          <Input label="Sprint" value={sprint} onChange={setSprint} placeholder="Ex: Sprint 15" />
        </div>
        <Select label="Responsável" value={responsavelId} onChange={setResponsavelId}
          options={[{ value: '', label: 'Selecione...' }, ...stakeholders.map((s) => ({ value: s.id, label: s.nome }))]} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar</Button>
        </div>
      </div>
    </Modal>
  );
}

// ===== Helpers =====

function EditableField({
  label, value, onSave, multiline = false, placeholder = '', className = '',
}: {
  label: string;
  value: string | null | undefined;
  onSave: (v: string | null) => void | Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  useEffect(() => { setDraft(value || ''); }, [value]);

  async function save() {
    setEditing(false);
    if ((value || '') === draft) return;
    await onSave(draft.trim() || null);
  }

  if (editing) {
    if (multiline) {
      return (
        <div className={className}>
          <p className="mb-1.5 text-xs font-medium text-tertiary">{label}</p>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-lg border border-brand-primary bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-tertiary">Ctrl+Enter salva · Esc cancela</p>
        </div>
      );
    }
    return (
      <div className={className}>
        <p className="mb-1.5 text-xs font-medium text-tertiary">{label}</p>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-brand-primary bg-elevated px-3 py-1.5 text-sm text-primary placeholder:text-tertiary focus:outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group block w-full rounded-lg border border-transparent px-3 py-1.5 text-left transition-colors hover:border-subtle hover:bg-hover-state ${className}`}
    >
      <p className="mb-0.5 text-xs font-medium text-tertiary">{label}</p>
      <p className="flex items-center gap-2 text-sm text-primary">
        <span className={value ? '' : 'italic text-tertiary'}>{value || placeholder || '—'}</span>
        <Edit3 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-tertiary" />
      </p>
    </button>
  );
}
