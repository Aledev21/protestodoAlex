import { useMemo } from 'react';
import {
  Bot, AlertTriangle, Lightbulb, TrendingDown, Clock, FileText,
  Sparkles, ArrowRight, CheckCircle2, AlertOctagon, Zap,
} from 'lucide-react';
import { Processo } from '../lib/types';
import { Card, Badge } from '../components/ui';
import { getEtapaLabel, getEtapaIndex, ETAPAS_PROCESSO } from '../lib/constants';

export default function AIPanel({
  processos,
  onOpenProcesso,
}: {
  processos: Processo[];
  onOpenProcesso: (id: string) => void;
}) {
  const insights = useMemo(() => generateInsights(processos), [processos]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-primary">Assistente IA</h1>
            <p className="mt-0.5 text-sm text-tertiary">Análise inteligente dos seus processos</p>
          </div>
        </div>
      </div>

      {/* Quick summary */}
      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-subtle bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-primary">Status Report Automático</h2>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-relaxed text-secondary">{insights.statusReport}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Riscos */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-primary">Riscos Detectados</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {insights.risks.map((risk, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${risk.severity === 'alta' ? 'bg-red-500' : risk.severity === 'media' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">{risk.message}</p>
                    {risk.processoId && (
                      <button onClick={() => onOpenProcesso(risk.processoId!)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                        Ver processo <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {insights.risks.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-tertiary">Nenhum risco detectado</p>
            )}
          </div>
        </Card>

        {/* Próximas ações */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-primary">Próximas Ações Sugeridas</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {insights.nextActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.processoId && onOpenProcesso(action.processoId)}
                className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-hover-state transition-colors"
              >
                <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm text-secondary">{action.message}</p>
                  {action.processoName && <p className="mt-0.5 text-xs text-tertiary">{action.processoName}</p>}
                </div>
                {action.processoId && <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-tertiary" />}
              </button>
            ))}
            {insights.nextActions.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-tertiary">Nenhuma ação pendente</p>
            )}
          </div>
        </Card>

        {/* Processos esquecidos */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-primary">Processos Esquecidos</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {insights.forgotten.map((p, i) => (
              <button
                key={i}
                onClick={() => onOpenProcesso(p.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-hover-state transition-colors"
              >
                <TrendingDown className="h-4 w-4 text-orange-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-primary">{p.nome}</p>
                  <p className="text-xs text-tertiary">Sem atualização há {p.daysSinceUpdate} dias</p>
                </div>
                <Badge color="amber">{p.etapa}</Badge>
              </button>
            ))}
            {insights.forgotten.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-tertiary">Nenhum processo esquecido</p>
            )}
          </div>
        </Card>

        {/* Gargalos */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-primary">Gargalos Identificados</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {insights.bottlenecks.map((b, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={b.count > 3 ? 'red' : 'amber'}>{b.count} processo(s)</Badge>
                  <span className="text-sm text-primary">{b.etapa}</span>
                </div>
                <p className="text-xs text-tertiary">{b.suggestion}</p>
              </div>
            ))}
            {insights.bottlenecks.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-tertiary">Nenhum gargalo detectado</p>
            )}
          </div>
        </Card>
      </div>

      {/* Resumo para reunião */}
      <Card className="mt-6">
        <div className="border-b border-subtle px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-primary">Resumo para Reunião</h2>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-relaxed text-secondary">{insights.meetingSummary}</p>
        </div>
      </Card>
    </div>
  );
}

function generateInsights(processos: Processo[]) {
  const now = new Date();
  const risks: { message: string; severity: string; processoId?: string }[] = [];
  const nextActions: { message: string; processoId?: string; processoName?: string }[] = [];
  const forgotten: any[] = [];
  const bottlenecks: { etapa: string; count: number; suggestion: string }[] = [];

  // Status report
  const total = processos.length;
  const andamento = processos.filter((p) => p.status === 'em_andamento').length;
  const bloqueados = processos.filter((p) => p.status === 'bloqueado').length;
  const concluidos = processos.filter((p) => p.status === 'concluido').length;
  const atrasados = processos.filter((p) => p.status === 'bloqueado' || p.status === 'pausado').length;

  // Risks: stale (sem atualização há muito tempo)
  processos.forEach((p) => {
    if (p.status === 'concluido') return;
    const daysSince = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      risks.push({
        message: `"${p.nome}" sem atualização há ${daysSince} dia(s) (última em ${new Date(p.updated_at).toLocaleDateString('pt-BR')}).`,
        severity: daysSince > 30 ? 'alta' : 'media',
        processoId: p.id,
      });
    }
  });

  // Risks: blocked
  processos.forEach((p) => {
    if (p.status === 'bloqueado') {
      risks.push({
        message: `"${p.nome}" está bloqueado. Verifique as pendências e tome ação para desbloquear.`,
        severity: 'alta',
        processoId: p.id,
      });
    }
  });

  // Next actions based on etapa
  processos.forEach((p) => {
    if (p.status === 'concluido') return;
    const etapaIdx = getEtapaIndex(p.etapa);

    if (p.etapa === 'aprovacao_horas' || p.etapa === 'aprovacao_cliente') {
      nextActions.push({
        message: 'Dar continuidade após aprovação do cliente. Considere enviar um follow-up.',
        processoId: p.id,
        processoName: p.nome,
      });
    }
    if (p.etapa === 'construcao_doc') {
      nextActions.push({
        message: 'Finalizar a documentação técnica e enviar para revisão interna.',
        processoId: p.id,
        processoName: p.nome,
      });
    }
    if (p.etapa === 'kickoff') {
      nextActions.push({
        message: 'Confirmar data do kickoff com todas as partes envolvidas.',
        processoId: p.id,
        processoName: p.nome,
      });
    }
    if (p.etapa === 'ava') {
      nextActions.push({
        message: 'Concluir a Avaliação de Viabilidade da Automação.',
        processoId: p.id,
        processoName: p.nome,
      });
    }
  });

  // Forgotten processes (no update in >7 days and not concluded)
  processos.forEach((p) => {
    if (p.status === 'concluido') return;
    const daysSinceUpdate = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 7) {
      forgotten.push({ ...p, daysSinceUpdate });
    }
  });
  forgotten.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  // Bottlenecks: group by etapa
  const etapaCounts: Record<string, number> = {};
  processos.forEach((p) => {
    if (p.status === 'concluido') return;
    etapaCounts[p.etapa] = (etapaCounts[p.etapa] || 0) + 1;
  });
  Object.entries(etapaCounts).forEach(([etapa, count]) => {
    if (count >= 2) {
      const etapaInfo = ETAPAS_PROCESSO.find((e) => e.value === etapa);
      const suggestions: Record<string, string> = {
        ava: 'Considere paralelizar as avaliações ou priorizar as mais antigas.',
        construcao_doc: 'Padronize templates de documentação para acelerar a escrita.',
        aprovacao_cliente: 'Envie follow-ups proativos ao cliente para acelerar a aprovação.',
        coleta: 'Agende reuniões de coleta em lote para ganhar eficiência.',
      };
      bottlenecks.push({
        etapa: etapaInfo?.label || etapa,
        count,
        suggestion: suggestions[etapa] || 'Considere alocar mais recursos nesta etapa.',
      });
    }
  });
  bottlenecks.sort((a, b) => b.count - a.count);

  // Status report text
  const statusReport = `Atualmente você gerencia ${total} processo(s) de automação. ${andamento} estão em andamento, ${bloqueados} bloqueado(s) e ${concluidos} concluído(s). ${atrasados > 0 ? `Atenção: ${atrasados} processo(s) estão atrasados em relação ao prazo previsto.` : 'Nenhum processo está atrasado.'} ${forgotten.length > 0 ? `${forgotten.length} processo(s) não recebem atualização há mais de 7 dias.` : 'Todos os processos tiveram atualizações recentes.'}`;

  // Meeting summary
  const meetingSummary = `Na próxima reunião de status, destaque: ${bloqueados > 0 ? `${bloqueados} processo(s) bloqueado(s) precisando de apoio da liderança ou cliente` : 'nenhum processo bloqueado no momento'}; ${atrasados > 0 ? `${atrasados} processo(s) atrasado(s) que precisam de plano de recuperação` : 'prazos em dia'}; ${forgotten.length > 0 ? `${forgotten.length} processo(s) sem atualização recente que precisam ser revisitados` : 'todos os processos ativos'}. As próximas ações prioritárias são: ${nextActions.slice(0, 3).map((a) => a.processoName).join(', ') || 'nenhuma ação pendente'}.`;

  return { risks, nextActions: nextActions.slice(0, 8), forgotten: forgotten.slice(0, 6), bottlenecks, statusReport, meetingSummary };
}
