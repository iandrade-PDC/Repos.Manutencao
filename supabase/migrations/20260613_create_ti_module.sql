-- ============================================================
-- Migration: Módulo de TI — Chamados de Suporte
-- Data: 2026-06-13
-- Descrição: Cria estrutura completa do módulo TI:
--   - Campo ti_role no profiles (multi-módulo)
--   - Tabelas: ti_categorias, ti_chamados, ti_atualizacoes, ti_ativos
--   - RLS Policies baseadas em ti_role
--   - Trigger para atualizado_em
--   - Seed de categorias iniciais
-- ============================================================

-- ============================================================
-- 1. ADICIONAR ti_role AO PROFILES
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ti_role TEXT
  CHECK (ti_role IN ('tecnico', 'colaborador'));

-- Setar admins existentes como técnicos TI
UPDATE public.profiles SET ti_role = 'tecnico' WHERE role = 'admin' AND ti_role IS NULL;
-- Setar demais como colaboradores TI
UPDATE public.profiles SET ti_role = 'colaborador' WHERE role != 'admin' AND ti_role IS NULL;

-- ============================================================
-- 2. TABELA: ti_categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ti_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA: ti_chamados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ti_chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.ti_categorias(id),
  solicitante_id UUID REFERENCES auth.users(id),
  tecnico_id UUID REFERENCES auth.users(id),
  prioridade TEXT NOT NULL DEFAULT 'media'
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  resolvido_em TIMESTAMPTZ
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_ti_chamados_status ON public.ti_chamados(status);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_prioridade ON public.ti_chamados(prioridade);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_solicitante ON public.ti_chamados(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_categoria ON public.ti_chamados(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_tecnico ON public.ti_chamados(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_criado_em ON public.ti_chamados(criado_em DESC);

-- Trigger: atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.ti_chamados_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ti_chamados_atualizado ON public.ti_chamados;
CREATE TRIGGER tr_ti_chamados_atualizado
  BEFORE UPDATE ON public.ti_chamados
  FOR EACH ROW
  EXECUTE FUNCTION public.ti_chamados_atualizar_timestamp();

-- ============================================================
-- 4. TABELA: ti_atualizacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ti_atualizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.ti_chamados(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id),
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'comentario'
    CHECK (tipo IN ('comentario', 'solucao', 'status_alterado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ti_atualizacoes_chamado ON public.ti_atualizacoes(chamado_id);
CREATE INDEX IF NOT EXISTS idx_ti_atualizacoes_criado ON public.ti_atualizacoes(criado_em ASC);

-- ============================================================
-- 5. TABELA: ti_ativos (Inventário de equipamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ti_ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  patrimonio TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  localizacao TEXT,
  status TEXT DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'manutencao', 'inativo', 'descartado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ti_ativos_tipo ON public.ti_ativos(tipo);
CREATE INDEX IF NOT EXISTS idx_ti_ativos_status ON public.ti_ativos(status);
CREATE INDEX IF NOT EXISTS idx_ti_ativos_responsavel ON public.ti_ativos(responsavel_id);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Função helper: verifica se o usuário logado é técnico TI
CREATE OR REPLACE FUNCTION public.is_ti_tecnico()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND ti_role = 'tecnico'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- ti_categorias ----
ALTER TABLE public.ti_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ti_categorias_select_autenticado"
  ON public.ti_categorias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ti_categorias_insert_tecnico"
  ON public.ti_categorias FOR INSERT
  TO authenticated
  WITH CHECK (public.is_ti_tecnico());

CREATE POLICY "ti_categorias_update_tecnico"
  ON public.ti_categorias FOR UPDATE
  TO authenticated
  USING (public.is_ti_tecnico());

-- ---- ti_chamados ----
ALTER TABLE public.ti_chamados ENABLE ROW LEVEL SECURITY;

-- Técnicos veem tudo; colaboradores veem apenas os próprios
CREATE POLICY "ti_chamados_select"
  ON public.ti_chamados FOR SELECT
  TO authenticated
  USING (
    public.is_ti_tecnico()
    OR solicitante_id = auth.uid()
  );

-- Qualquer autenticado pode abrir chamado
CREATE POLICY "ti_chamados_insert"
  ON public.ti_chamados FOR INSERT
  TO authenticated
  WITH CHECK (solicitante_id = auth.uid());

-- Técnicos podem atualizar qualquer chamado; solicitante pode atualizar o próprio (ex: fechar)
CREATE POLICY "ti_chamados_update"
  ON public.ti_chamados FOR UPDATE
  TO authenticated
  USING (
    public.is_ti_tecnico()
    OR solicitante_id = auth.uid()
  );

-- ---- ti_atualizacoes ----
ALTER TABLE public.ti_atualizacoes ENABLE ROW LEVEL SECURITY;

-- Leitura: técnicos leem tudo; colaboradores leem atualizações dos próprios chamados
CREATE POLICY "ti_atualizacoes_select"
  ON public.ti_atualizacoes FOR SELECT
  TO authenticated
  USING (
    public.is_ti_tecnico()
    OR EXISTS (
      SELECT 1 FROM public.ti_chamados
      WHERE ti_chamados.id = ti_atualizacoes.chamado_id
      AND ti_chamados.solicitante_id = auth.uid()
    )
  );

-- Inserção: qualquer autenticado pode comentar em chamados que pode ver
CREATE POLICY "ti_atualizacoes_insert"
  ON public.ti_atualizacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      public.is_ti_tecnico()
      OR EXISTS (
        SELECT 1 FROM public.ti_chamados
        WHERE ti_chamados.id = chamado_id
        AND ti_chamados.solicitante_id = auth.uid()
      )
    )
  );

-- ---- ti_ativos ----
ALTER TABLE public.ti_ativos ENABLE ROW LEVEL SECURITY;

-- Leitura para todos autenticados
CREATE POLICY "ti_ativos_select_autenticado"
  ON public.ti_ativos FOR SELECT
  TO authenticated
  USING (true);

-- Escrita apenas para técnicos
CREATE POLICY "ti_ativos_insert_tecnico"
  ON public.ti_ativos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_ti_tecnico());

CREATE POLICY "ti_ativos_update_tecnico"
  ON public.ti_ativos FOR UPDATE
  TO authenticated
  USING (public.is_ti_tecnico());

CREATE POLICY "ti_ativos_delete_tecnico"
  ON public.ti_ativos FOR DELETE
  TO authenticated
  USING (public.is_ti_tecnico());

-- ============================================================
-- 7. SEED DATA: Categorias iniciais
-- ============================================================
INSERT INTO public.ti_categorias (nome, descricao) VALUES
  ('Hardware', 'Problemas com computadores, impressoras, monitores, cabos e periféricos'),
  ('Software', 'Instalação, atualização ou erro em programas e sistemas'),
  ('Rede / Internet', 'Problemas de conexão, Wi-Fi, cabeamento de rede'),
  ('Acessos e Permissões', 'Criação de contas, redefinição de senhas, permissões de sistema'),
  ('Outros', 'Demandas que não se encaixam nas categorias acima')
ON CONFLICT DO NOTHING;
