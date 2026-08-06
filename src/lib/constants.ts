export const ETAPAS_PROCESSO: { value: string; label: string; group: string }[] = [
  { value: 'coleta', label: 'Reunião de Coleta', group: 'Descoberta' },
  { value: 'ava', label: 'AVA', group: 'Descoberta' },
  { value: 'revisao_horas', label: 'Revisão de Horas', group: 'Avaliação' },
  { value: 'envio_horas_cliente', label: 'Envio de Horas ao Cliente', group: 'Avaliação' },
  { value: 'aprovacao_horas', label: 'Aguardando Aprovação de Horas', group: 'Avaliação' },
  { value: 'construcao_doc', label: 'Construção da Documentação', group: 'Documentação' },
  { value: 'revisao_interna', label: 'Revisão Interna', group: 'Documentação' },
  { value: 'envio_gp', label: 'Envio ao GP', group: 'Documentação' },
  { value: 'aprovacao_cliente', label: 'Aprovação do Cliente', group: 'Documentação' },
  { value: 'ajustes_doc', label: 'Ajustes na Documentação', group: 'Documentação' },
  { value: 'kickoff', label: 'Agendamento do Kickoff', group: 'Execução' },
  { value: 'construcao', label: 'Construção da Automação', group: 'Execução' },
  { value: 'concluido', label: 'Processo Concluído', group: 'Finalização' },
];

export const STATUS_PROCESSO: { value: string; label: string; color: string }[] = [
  { value: 'em_andamento', label: 'Em Andamento', color: 'blue' },
  { value: 'concluido', label: 'Concluído', color: 'green' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'red' },
  { value: 'pausado', label: 'Pausado', color: 'amber' },
];

export const STATUS_AUTOMACAO: { value: string; label: string; color: string }[] = [
  { value: 'nao_iniciado', label: 'Não Iniciado', color: 'slate' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'blue' },
  { value: 'concluido', label: 'Concluído', color: 'green' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'red' },
  { value: 'pausado', label: 'Pausado', color: 'amber' },
];

export const PRIORIDADES: { value: string; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'slate' },
  { value: 'media', label: 'Média', color: 'blue' },
  { value: 'alta', label: 'Alta', color: 'amber' },
  { value: 'critica', label: 'Crítica', color: 'red' },
];

export const TIPOS_PENDENCIA: { value: string; label: string; color: string; icon: string }[] = [
  { value: 'pendencia', label: 'Pendência', color: 'amber', icon: 'alert-circle' },
  { value: 'bloqueio', label: 'Bloqueio', color: 'red', icon: 'octagon-alert' },
  { value: 'dependencia', label: 'Dependência', color: 'purple', icon: 'link' },
  { value: 'duvida', label: 'Dúvida', color: 'blue', icon: 'help-circle' },
  { value: 'aguardando', label: 'Aguardando', color: 'cyan', icon: 'clock' },
];

export const AGUARDANDO_QUEM: { value: string; label: string }[] = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'sme', label: 'SME' },
  { value: 'lideranca', label: 'Liderança' },
  { value: 'gp', label: 'GP' },
  { value: 'analista', label: 'Analista' },
];

export const TIPOS_AUTOMACAO: string[] = ['Dispatcher', 'Performer', 'API', 'IA', 'Outro'];

export const PAPEIS_STAKEHOLDER: { value: string; label: string }[] = [
  { value: 'ba', label: 'BA (Business Analyst)' },
  { value: 'analista', label: 'Analista Responsável' },
  { value: 'arquiteto', label: 'Arquiteto' },
  { value: 'gp', label: 'GP' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'sme', label: 'SME' },
  { value: 'lideranca', label: 'Liderança' },
  { value: 'outro', label: 'Outro' },
];

// Rótulos curtos para os 3 papéis prioritários exibidos na seção "Pessoas Envolvidas"
export const PAPEIS_DESTAQUE = ['ba', 'arquiteto', 'gp'] as const;

export function getEtapaLabel(value: string): string {
  return ETAPAS_PROCESSO.find((e) => e.value === value)?.label ?? value;
}

export function getEtapaIndex(value: string): number {
  return ETAPAS_PROCESSO.findIndex((e) => e.value === value);
}

export function getStatusLabel(value: string, type: 'processo' | 'automacao' = 'processo'): string {
  const list = type === 'processo' ? STATUS_PROCESSO : STATUS_AUTOMACAO;
  return list.find((s) => s.value === value)?.label ?? value;
}

export function getPrioridadeLabel(value: string): string {
  return PRIORIDADES.find((p) => p.value === value)?.label ?? value;
}

export function getPendenciaTipo(value: string) {
  return TIPOS_PENDENCIA.find((t) => t.value === value);
}
