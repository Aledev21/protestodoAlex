import { useMemo } from 'react';
import {
  TrendingUp, CircleDot, CheckCircle2, AlertOctagon, Clock, Users,
  Layers, FileText, ArrowRight, CalendarClock, Activity, Bot,
} from 'lucide-react';
import { Processo, Frente } from '../lib/types';
import { Card, Badge } from '../components/ui';
import { getStatusLabel, getEtapaLabel, getPrioridadeLabel, STATUS_PROCESSO, PRIORIDADES } from '../lib/constants';

export default function Dashboard({
  processos,
  frentes,
  loading,
  onNavigate,
}: {
  processos: Processo[];
  frentes: Frente[];
  loading: boolean;
  onNavigate: (v: any) => void;
}) {
  const stats = useMemo(() => {
    const totalProcessos = processos.length;
    const allAutomacoes = processos.flatMap((p) => p.automacoes || []);
    const totalAutomacoes = allAutomacoes.length;
    const emAndamento = processos.filter((p) => p.status === 'em_andamento').length;
    const concluidos = processos.filter((p) => p.status === 'concluido').length;
    const bloqueados = processos.filter((p) => p.status === 'bloqueado').length;
    const aguardandoCliente = processos.filter((p) => p.etapa === 'aprovacao_cliente' || p.etapa === 'aprovacao_horas').length;
    const atrasados = processos.filter((p) => {
      if (!p.data_prevista || p.status === 'concluido') return false;
      return new Date(p.data_prevista) < new Date();
    }).length;

    const automacoesPorProcesso = totalProcessos > 0 ? (totalAutomacoes / totalProcessos).toFixed(1) : '0';

    const porResponsavel: Record<string, number> = {};
    processos.forEach((p) => {
      const name = p.responsavel?.nome || 'Sem responsável';
      porResponsavel[name] = (porResponsavel[name] || 0) + 1;
    });

    const porFrente: Record<string, { count: number; automacoes: number }> = {};
    processos.forEach((p) => {
      const name = p.frente?.nome || 'Sem frente';
      if (!porFrente[name]) porFrente[name] = { count: 0, automacoes: 0 };
      porFrente[name].count++;
      porFrente[name].automacoes += p.automacoes?.length || 0;
    });

    return {
      totalProcessos, totalAutomacoes, emAndamento, concluidos, bloqueados,
      aguardandoCliente, atrasados, automacoesPorProcesso, porResponsavel, porFrente,
    };
  }, [processos]);

  const recentProcessos = useMemo(() => {
    return [...processos]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [processos]);

  const needsAttention = useMemo(() => {
    return processos.filter((p) => p.status === 'bloqueado' || (p.data_prevista && new Date(p.data_prevista) < new Date() && p.status !== 'concluido'))
      .slice(0, 5);
  }, [processos]);

  const maxResp = Math.max(...Object.values(stats.porResponsavel), 1);

  const kpis = [
    { label: 'Total de Processos', value: stats.totalProcessos, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total de Automações', value: stats.totalAutomacoes, icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Em Andamento', value: stats.emAndamento, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Concluídos', value: stats.concluidos, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Bloqueados', value: stats.bloqueados, icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Aguardando Cliente', value: stats.aguardandoCliente, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Atrasados', value: stats.atrasados, icon: CalendarClock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Automações/Processo', value: stats.automacoesPorProcesso, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-tertiary">Visão geral dos seus processos e automações</p>
        </div>
        <button
          onClick={() => onNavigate({ name: 'ai' })}
          className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
        >
          <Bot className="h-4 w-4" />
          Assistente IA
        </button>
      </div>

      {/* KPI Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5 transition-colors hover:border-default">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <span className="text-3xl font-bold text-primary">{kpi.value}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-secondary">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Needs attention */}
        <Card className="lg:col-span-2">
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-primary">Processos que precisam de atenção</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {needsAttention.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-tertiary">Nenhum processo bloqueado ou atrasado</p>
            )}
            {needsAttention.map((p) => {
              const isBlocked = p.status === 'bloqueado';
              const isLate = p.data_prevista && new Date(p.data_prevista) < new Date() && p.status !== 'concluido';
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate({ name: 'processo', id: p.id })}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-hover-state transition-colors"
                >
                  <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-500' : 'bg-orange-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                    <p className="text-xs text-tertiary">{p.frente?.nome} · {getEtapaLabel(p.etapa)}</p>
                  </div>
                  {isBlocked && <Badge color="red">Bloqueado</Badge>}
                  {isLate && <Badge color="amber">Atrasado</Badge>}
                  <ArrowRight className="h-4 w-4 text-tertiary" />
                </button>
              );
            })}
          </div>
        </Card>

        {/* Processos por frente */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <h2 className="text-sm font-semibold text-primary">Processos por Frente</h2>
          </div>
          <div className="space-y-3 p-5">
            {Object.entries(stats.porFrente).map(([frente, data]) => {
              const maxCount = Math.max(...Object.values(stats.porFrente).map((d) => d.count), 1);
              return (
                <div key={frente}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">{frente}</span>
                    <span className="text-tertiary">{data.count} processos · {data.automacoes} autom.</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(data.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <div className="border-b border-subtle px-5 py-4">
            <h2 className="text-sm font-semibold text-primary">Atividade Recente</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentProcessos.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate({ name: 'processo', id: p.id })}
                className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-hover-state transition-colors"
              >
                <CircleDot className="h-4 w-4 text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{p.nome}</p>
                  <p className="text-xs text-tertiary">{getEtapaLabel(p.etapa)} · {p.frente?.nome}</p>
                </div>
                <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                  {getStatusLabel(p.status)}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {/* Por responsável */}
        <Card>
          <div className="border-b border-subtle px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-tertiary" />
              <h2 className="text-sm font-semibold text-primary">Por Responsável</h2>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {Object.entries(stats.porResponsavel).map(([name, count]) => (
              <div key={name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">{name}</span>
                  <span className="text-tertiary">{count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(count / maxResp) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Status distribution */}
      <Card className="mt-6">
        <div className="border-b border-subtle px-5 py-4">
          <h2 className="text-sm font-semibold text-primary">Distribuição de Status</h2>
        </div>
        <div className="flex flex-wrap gap-4 p-5">
          {STATUS_PROCESSO.map((s) => {
            const count = processos.filter((p) => p.status === s.value).length;
            const pct = processos.length > 0 ? (count / processos.length) * 100 : 0;
            return (
              <div key={s.value} className="flex-1 min-w-[140px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-secondary">{s.label}</span>
                  <span className="text-xs font-semibold text-primary">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={`h-full rounded-full status-${s.color}`}
                    style={{ width: `${pct}%`, backgroundColor: 'currentColor' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
