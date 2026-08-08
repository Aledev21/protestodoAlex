export type Visibilidade = 'shared' | 'private';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface Frente {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  arquivado: boolean;
  owner_id: string | null;
  visibilidade: Visibilidade;
  created_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  created_at: string;
}

export interface Area {
  id: string;
  nome: string;
  frente_id: string | null;
  arquivado: boolean;
  owner_id: string | null;
  visibilidade: Visibilidade;
  created_at: string;
}

export interface Stakeholder {
  id: string;
  nome: string;
  email: string | null;
  tipo: string;
  created_at: string;
}

export interface ProcessoStakeholder {
  id: string;
  processo_id: string;
  stakeholder_id: string;
  papel: string;
  stakeholder?: Stakeholder;
}

export interface Processo {
  id: string;
  frente_id: string | null;
  cliente_id: string | null;
  area_id: string | null;
  responsavel_id: string | null;
  sme: string | null;
  nome: string;
  descricao: string | null;
  objetivo: string | null;
  escopo: string | null;
  caminho_anexo: string | null;
  volumetria: string | null;
  saving: string | null;
  status: string;
  etapa: string;
  prioridade: string;
  arquivado: boolean;
  owner_id: string | null;
  visibilidade: Visibilidade;
  data_criacao: string | null;
  created_at: string;
  updated_at: string;
  frente?: Frente;
  cliente?: Cliente;
  area?: Area;
  responsavel?: Stakeholder;
  sme_stakeholder?: Stakeholder;
  processo_stakeholders?: ProcessoStakeholder[];
  automacoes?: Automacao[];
}

// Tabelas de compartilhamento
export interface FrenteShare {
  id: string;
  frente_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface AreaShare {
  id: string;
  area_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface ProcessoShare {
  id: string;
  processo_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface Automacao {
  id: string;
  processo_id: string;
  responsavel_id: string | null;
  nome: string;
  tipo: string;
  status: string;
  sprint: string | null;
  documentacao: string | null;
  progresso: number;
  arquivado: boolean;
  created_at: string;
  updated_at: string;
  responsavel?: Stakeholder;
}

export interface TimelineEvent {
  id: string;
  processo_id: string | null;
  automacao_id: string | null;
  data: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  created_at: string;
}

export interface Pendencia {
  id: string;
  processo_id: string | null;
  automacao_id: string | null;
  tipo: string;
  aguardando_quem: string | null;
  descricao: string;
  resolvida: boolean;
  data_criacao: string | null;
  data_resolucao: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  processo_id: string | null;
  automacao_id: string | null;
  texto: string;
  concluido: boolean;
  ordem: number;
  created_at: string;
}

export interface Comentario {
  id: string;
  processo_id: string;
  autor: string | null;
  texto: string;
  created_at: string;
}

export interface Anexo {
  id: string;
  processo_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  nome: string;
  cor: string | null;
}

export interface ProcessoTag {
  id: string;
  processo_id: string;
  tag_id: string;
  tag?: Tag;
}
