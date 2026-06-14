// ============================================================
// Types do Módulo de TI — Chamados de Suporte
// ============================================================

/** Role do usuário dentro do módulo de TI */
export type TiRole = 'tecnico' | 'colaborador';

/** Níveis de prioridade de um chamado TI */
export type TiPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

/** Estados possíveis de um chamado TI */
export type TiStatus = 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido' | 'fechado';

/** Tipos de atualização em um chamado */
export type TiTipoAtualizacao = 'comentario' | 'solucao' | 'status_alterado';

/** Status de um ativo de TI */
export type TiAtivoStatus = 'ativo' | 'manutencao' | 'inativo' | 'descartado';

// ============================================================
// Interfaces das Tabelas
// ============================================================

/** Categoria de chamado TI (tabela: ti_categorias) */
export interface TiCategoria {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
}

/** Chamado de TI (tabela: ti_chamados) */
export interface TiChamado {
  id: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  categoria_id: string | null;
  solicitante_id: string;
  tecnico_id: string | null;
  prioridade: TiPrioridade;
  status: TiStatus;
  criado_em: string;
  atualizado_em: string;
  resolvido_em: string | null;
}

/** Atualização / histórico de um chamado (tabela: ti_atualizacoes) */
export interface TiAtualizacao {
  id: string;
  chamado_id: string;
  autor_id: string;
  mensagem: string;
  tipo: TiTipoAtualizacao;
  criado_em: string;
}

/** Ativo de TI / inventário (tabela: ti_ativos) */
export interface TiAtivo {
  id: string;
  nome: string;
  tipo: string;
  patrimonio: string | null;
  responsavel_id: string | null;
  localizacao: string | null;
  status: TiAtivoStatus;
  criado_em: string;
}

// ============================================================
// Response Genérico do Service
// ============================================================

/** Wrapper de resposta padronizado para todas as funções do service */
export interface ServiceResponse<T> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
}

// ============================================================
// Tipos Compostos (com JOINs)
// ============================================================

/** Dados resumidos de um usuário (para exibição em chamados) */
export interface TiUsuarioResumo {
  id: string;
  full_name: string;
  email: string;
}

/** Chamado completo com dados expandidos de categoria, solicitante, técnico e atualizações */
export interface TiChamadoCompleto extends TiChamado {
  categoria: TiCategoria | null;
  solicitante: TiUsuarioResumo;
  tecnico: TiUsuarioResumo | null;
  atualizacoes: TiAtualizacao[];
}

// ============================================================
// Filtros e Relatórios
// ============================================================

/** Filtros opcionais para listagem de chamados */
export interface TiChamadoFiltros {
  status?: TiStatus | 'pendentes';
  prioridade?: TiPrioridade;
  categoria_id?: string;
  solicitante_id?: string;
}

/** Item de contagem agrupada (status ou categoria) */
export interface TiContagemItem {
  label: string;
  total: number;
}

/** Chamado pendente há mais de 48h (para relatório) */
export interface TiChamadoPendente {
  id: string;
  numero: number;
  titulo: string;
  prioridade: TiPrioridade;
  criado_em: string;
  horas_aberto: number;
}

/** Relatório mensal de chamados TI */
export interface TiRelatorio {
  /** Total de chamados no período */
  total: number;
  /** Contagem de chamados por status */
  por_status: TiContagemItem[];
  /** Contagem de chamados por categoria */
  por_categoria: TiContagemItem[];
  /** Tempo médio de resolução em horas (apenas chamados resolvidos) */
  tempo_medio_horas: number | null;
  /** Chamados abertos/em andamento há mais de 48h sem resolução */
  chamados_pendentes_48h: TiChamadoPendente[];
}
