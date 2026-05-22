-- Migration: Adiciona colunas GUT e requester_id à tabela orders
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar requester_id (referência ao usuário)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id);

-- 2. Adicionar colunas GUT (se ainda não existirem)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gut_g INTEGER CHECK (gut_g BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS gut_u INTEGER CHECK (gut_u BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS gut_t INTEGER CHECK (gut_t BETWEEN 1 AND 5);

-- 3. Adicionar coluna gut_score como coluna gerada automaticamente
-- Primeiro, verificar se a coluna já existe como coluna comum e removê-la
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'gut_score'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders DROP COLUMN gut_score;
  END IF;
END $$;

-- Recriar como coluna gerada
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gut_score INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN gut_g IS NOT NULL AND gut_u IS NOT NULL AND gut_t IS NOT NULL 
      THEN gut_g * gut_u * gut_t 
      ELSE NULL 
    END
  ) STORED;

-- 4. Índice para ordenação por prioridade
CREATE INDEX IF NOT EXISTS idx_orders_gut_score ON public.orders(gut_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_orders_requester_id ON public.orders(requester_id);

-- 5. Verificar colunas criadas
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
