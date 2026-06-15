// ============================================================
// Service Layer — Módulo de TI (Chamados de Suporte)
// ============================================================
// Todas as funções usam async/await com try/catch e retornam
// ServiceResponse<T> padronizado: { sucesso, dados?, erro? }
// ============================================================

import { supabase } from './supabase';
import type {
  ServiceResponse,
  TiCategoria,
  TiChamado,
  TiChamadoCompleto,
  TiChamadoFiltros,
  TiChamadoPendente,
  TiAtualizacao,
  TiContagemItem,
  TiPrioridade,
  TiRelatorio,
  TiStatus,
  TiTipoAtualizacao,
  TiUsuarioResumo,
} from '../types/ti';

// ============================================================
// 1. abrirChamado
// ============================================================

/**
 * Cria um novo chamado de TI com status 'aberto'.
 *
 * @param titulo - Título resumido do problema
 * @param descricao - Descrição detalhada
 * @param categoriaId - UUID da categoria (ti_categorias)
 * @param prioridade - Nível de prioridade
 * @param userId - UUID do usuário solicitante (auth.uid)
 * @returns O número sequencial do chamado criado
 */
export async function abrirChamado(
  titulo: string,
  descricao: string,
  categoriaId: string,
  prioridade: TiPrioridade,
  userId: string
): Promise<ServiceResponse<{ numero: number }>> {
  try {
    if (!titulo.trim()) {
      return { sucesso: false, erro: 'O título é obrigatório' };
    }

    const { data, error } = await supabase
      .from('ti_chamados')
      .insert({
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        categoria_id: categoriaId || null,
        prioridade,
        solicitante_id: userId,
        status: 'aberto',
      })
      .select('numero')
      .single();

    if (error) throw error;

    return { sucesso: true, dados: { numero: data.numero } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao abrir chamado';
    console.error('tiService.abrirChamado:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 2. listarChamados
// ============================================================

/**
 * Lista chamados de TI com filtros opcionais.
 * Se o usuário for colaborador (não técnico), força filtro pelo próprio ID.
 *
 * @param filtros - Filtros opcionais (status, prioridade, categoria_id, solicitante_id)
 * @param userId - UUID do usuário logado
 * @param isTecnico - Se o usuário tem ti_role = 'tecnico'
 * @returns Lista de chamados ordenada por criado_em DESC
 */
export async function listarChamados(
  filtros: TiChamadoFiltros,
  userId: string,
  isTecnico: boolean
): Promise<ServiceResponse<TiChamado[]>> {
  try {
    let query = supabase
      .from('ti_chamados')
      .select('*')
      .order('criado_em', { ascending: false });

    // Colaborador: forçar filtro pelo próprio ID (RLS já faz isso,
    // mas aplicamos também no client para clareza)
    if (!isTecnico) {
      query = query.eq('solicitante_id', userId);
    }

    // Filtros opcionais
    if (filtros.status) {
      if (filtros.status === 'pendentes') {
        query = query.in('status', ['aberto', 'em_andamento', 'aguardando']);
      } else {
        query = query.eq('status', filtros.status);
      }
    }
    if (filtros.prioridade) {
      query = query.eq('prioridade', filtros.prioridade);
    }
    if (filtros.categoria_id) {
      query = query.eq('categoria_id', filtros.categoria_id);
    }
    if (filtros.solicitante_id && isTecnico) {
      query = query.eq('solicitante_id', filtros.solicitante_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { sucesso: true, dados: data as TiChamado[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar chamados';
    console.error('tiService.listarChamados:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 3. buscarChamado
// ============================================================

/**
 * Busca um chamado completo por ID, incluindo:
 * - Dados da categoria (ti_categorias)
 * - Nome e email do solicitante e técnico (profiles)
 * - Todas as atualizações ordenadas por criado_em ASC
 *
 * @param chamadoId - UUID do chamado
 * @returns Chamado completo com JOINs expandidos
 */
export async function buscarChamado(
  chamadoId: string
): Promise<ServiceResponse<TiChamadoCompleto>> {
  try {
    // Buscar o chamado com joins no Supabase
    const { data: chamado, error } = await supabase
      .from('ti_chamados')
      .select(`
        *,
        ti_categorias (
          id,
          nome,
          descricao,
          ativo,
          criado_em
        )
      `)
      .eq('id', chamadoId)
      .single();

    if (error) throw error;
    if (!chamado) {
      return { sucesso: false, erro: 'Chamado não encontrado' };
    }

    // Buscar dados do solicitante
    const { data: solicitante } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', chamado.solicitante_id)
      .single();

    // Buscar dados do técnico (se atribuído)
    let tecnico: TiUsuarioResumo | null = null;
    if (chamado.tecnico_id) {
      const { data: tecnicoData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', chamado.tecnico_id)
        .single();

      if (tecnicoData) {
        tecnico = {
          id: tecnicoData.id,
          full_name: tecnicoData.full_name,
          email: tecnicoData.email,
        };
      }
    }

    // Buscar atualizações
    const { data: atualizacoes } = await supabase
      .from('ti_atualizacoes')
      .select('*')
      .eq('chamado_id', chamadoId)
      .order('criado_em', { ascending: true });

    // Montar objeto completo
    const chamadoCompleto: TiChamadoCompleto = {
      id: chamado.id,
      numero: chamado.numero,
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      categoria_id: chamado.categoria_id,
      solicitante_id: chamado.solicitante_id,
      tecnico_id: chamado.tecnico_id,
      prioridade: chamado.prioridade,
      status: chamado.status,
      criado_em: chamado.criado_em,
      atualizado_em: chamado.atualizado_em,
      resolvido_em: chamado.resolvido_em,
      categoria: chamado.ti_categorias as TiCategoria | null,
      solicitante: solicitante
        ? { id: solicitante.id, full_name: solicitante.full_name, email: solicitante.email }
        : { id: chamado.solicitante_id, full_name: 'Desconhecido', email: '' },
      tecnico,
      atualizacoes: (atualizacoes as TiAtualizacao[]) || [],
    };

    return { sucesso: true, dados: chamadoCompleto };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar chamado';
    console.error('tiService.buscarChamado:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 4. atualizarStatus
// ============================================================

/**
 * Altera o status de um chamado e registra a mudança em ti_atualizacoes.
 * Se o novo status for 'resolvido', preenche resolvido_em com NOW().
 *
 * @param chamadoId - UUID do chamado
 * @param novoStatus - Novo status a ser definido
 * @param mensagem - Mensagem descrevendo a mudança
 * @param autorId - UUID do autor da alteração
 * @returns void em caso de sucesso
 */
export async function atualizarStatus(
  chamadoId: string,
  novoStatus: TiStatus,
  mensagem: string,
  autorId: string
): Promise<ServiceResponse<void>> {
  try {
    // Preparar update do chamado
    const updateData: Record<string, unknown> = {
      status: novoStatus,
    };

    // Se resolvido, preencher resolvido_em
    if (novoStatus === 'resolvido') {
      updateData.resolvido_em = new Date().toISOString();
    }

    // 1. Atualizar o status do chamado
    const { error: updateError } = await supabase
      .from('ti_chamados')
      .update(updateData)
      .eq('id', chamadoId);

    if (updateError) throw updateError;

    // 2. Registrar a mudança em ti_atualizacoes
    const { error: logError } = await supabase
      .from('ti_atualizacoes')
      .insert({
        chamado_id: chamadoId,
        autor_id: autorId,
        mensagem: mensagem.trim() || `Status alterado para: ${novoStatus}`,
        tipo: 'status_alterado' as TiTipoAtualizacao,
      });

    if (logError) {
      console.error('tiService.atualizarStatus: erro ao criar log:', logError);
      // Não falha a operação principal por causa do log
    }

    return { sucesso: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
    console.error('tiService.atualizarStatus:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 5. adicionarAtualizacao
// ============================================================

/**
 * Insere uma nova atualização (comentário ou solução) em um chamado.
 *
 * @param chamadoId - UUID do chamado
 * @param mensagem - Conteúdo da atualização
 * @param tipo - Tipo: 'comentario' ou 'solucao'
 * @param autorId - UUID do autor
 * @returns O registro de atualização criado
 */
export async function adicionarAtualizacao(
  chamadoId: string,
  mensagem: string,
  tipo: TiTipoAtualizacao,
  autorId: string
): Promise<ServiceResponse<TiAtualizacao>> {
  try {
    if (!mensagem.trim()) {
      return { sucesso: false, erro: 'A mensagem é obrigatória' };
    }

    // Validar tipo permitido para esta função
    if (tipo !== 'comentario' && tipo !== 'solucao') {
      return { sucesso: false, erro: 'Tipo deve ser "comentario" ou "solucao"' };
    }

    const { data, error } = await supabase
      .from('ti_atualizacoes')
      .insert({
        chamado_id: chamadoId,
        autor_id: autorId,
        mensagem: mensagem.trim(),
        tipo,
      })
      .select()
      .single();

    if (error) throw error;

    return { sucesso: true, dados: data as TiAtualizacao };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao adicionar atualização';
    console.error('tiService.adicionarAtualizacao:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 6. listarCategorias
// ============================================================

/**
 * Retorna todas as categorias de TI ativas, ordenadas por nome.
 *
 * @returns Lista de categorias ativas
 */
export async function listarCategorias(): Promise<ServiceResponse<TiCategoria[]>> {
  try {
    const { data, error } = await supabase
      .from('ti_categorias')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) throw error;

    // Remove duplicated categories based on name
    const uniqueData = (data as TiCategoria[]).filter((cat, index, self) =>
      index === self.findIndex((c) => c.nome === cat.nome)
    );

    return { sucesso: true, dados: uniqueData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar categorias';
    console.error('tiService.listarCategorias:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 7. gerarRelatorio
// ============================================================

/**
 * Gera relatório mensal de chamados de TI com métricas agregadas:
 * - Total de chamados no período
 * - Chamados por status
 * - Chamados por categoria
 * - Tempo médio de resolução (em horas)
 * - Chamados abertos/em andamento há mais de 48h
 *
 * @param mes - Mês (1-12)
 * @param ano - Ano (ex: 2026)
 * @returns Objeto TiRelatorio com todas as métricas
 */
export async function gerarRelatorio(
  mes: number,
  ano: number
): Promise<ServiceResponse<TiRelatorio>> {
  try {
    // Calcular range de datas do mês
    const inicioMes = new Date(ano, mes - 1, 1).toISOString();
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999).toISOString();

    // Buscar todos os chamados do período
    const { data: chamados, error } = await supabase
      .from('ti_chamados')
      .select(`
        id,
        numero,
        titulo,
        prioridade,
        status,
        categoria_id,
        criado_em,
        resolvido_em,
        ti_categorias (nome)
      `)
      .gte('criado_em', inicioMes)
      .lte('criado_em', fimMes);

    if (error) throw error;

    const lista = chamados || [];

    // --- Total ---
    const total = lista.length;

    // --- Por status ---
    const statusMap = new Map<string, number>();
    lista.forEach((c) => {
      const s = c.status as string;
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const por_status: TiContagemItem[] = Array.from(statusMap.entries()).map(
      ([label, total]) => ({ label, total })
    );

    // --- Por categoria ---
    const categoriaMap = new Map<string, number>();
    lista.forEach((c) => {
      const catObj = c.ti_categorias as any;
      const catNome = (Array.isArray(catObj) ? catObj[0]?.nome : catObj?.nome) || 'Sem categoria';
      categoriaMap.set(catNome, (categoriaMap.get(catNome) || 0) + 1);
    });
    const por_categoria: TiContagemItem[] = Array.from(categoriaMap.entries()).map(
      ([label, total]) => ({ label, total })
    );

    // --- Tempo médio de resolução ---
    const resolvidos = lista.filter(
      (c) => c.resolvido_em && c.criado_em
    );
    let tempo_medio_horas: number | null = null;
    if (resolvidos.length > 0) {
      const somaHoras = resolvidos.reduce((acc, c) => {
        const inicio = new Date(c.criado_em).getTime();
        const fim = new Date(c.resolvido_em!).getTime();
        const diffHoras = (fim - inicio) / (1000 * 60 * 60);
        return acc + diffHoras;
      }, 0);
      tempo_medio_horas = Math.round((somaHoras / resolvidos.length) * 100) / 100;
    }

    // --- Chamados pendentes há mais de 48h ---
    // Buscar chamados NÃO resolvidos/fechados que existem há mais de 48h
    const agora = Date.now();
    const limite48h = 48 * 60 * 60 * 1000; // 48h em ms

    const { data: pendentes, error: pendentesError } = await supabase
      .from('ti_chamados')
      .select('id, numero, titulo, prioridade, criado_em')
      .in('status', ['aberto', 'em_andamento', 'aguardando'])
      .order('criado_em', { ascending: true });

    if (pendentesError) {
      console.error('tiService.gerarRelatorio: erro ao buscar pendentes:', pendentesError);
    }

    const chamados_pendentes_48h: TiChamadoPendente[] = (pendentes || [])
      .filter((c) => {
        const criado = new Date(c.criado_em).getTime();
        return agora - criado > limite48h;
      })
      .map((c) => ({
        id: c.id,
        numero: c.numero,
        titulo: c.titulo,
        prioridade: c.prioridade as TiPrioridade,
        criado_em: c.criado_em,
        horas_aberto: Math.round(((agora - new Date(c.criado_em).getTime()) / (1000 * 60 * 60)) * 10) / 10,
      }));

    const relatorio: TiRelatorio = {
      total,
      por_status,
      por_categoria,
      tempo_medio_horas,
      chamados_pendentes_48h,
    };

    return { sucesso: true, dados: relatorio };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar relatório';
    console.error('tiService.gerarRelatorio:', message);
    return { sucesso: false, erro: message };
  }
}

// ============================================================
// 8. deletarChamado
// ============================================================

/**
 * Exclui fisicamente um chamado e suas atualizações (via CASCADE no DB).
 * Apenas usuários técnicos/admins devem poder fazer isso.
 *
 * @param chamadoId - UUID do chamado
 * @returns void em caso de sucesso
 */
export async function deletarChamado(chamadoId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('ti_chamados')
      .delete()
      .eq('id', chamadoId);

    if (error) throw error;

    return { sucesso: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao deletar chamado';
    console.error('tiService.deletarChamado:', message);
    return { sucesso: false, erro: message };
  }
}
