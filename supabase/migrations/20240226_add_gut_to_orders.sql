-- Add GUT Matrix columns to orders table
-- G = Gravidade (1-5): Impacto se o problema continuar
-- U = Urgência (1-5): Pressão do tempo para resolver
-- T = Tendência (1-5): Tendência de piorar sem ação
-- GUT Score = G x U x T (max 125)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gut_g INTEGER CHECK (gut_g BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS gut_u INTEGER CHECK (gut_u BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS gut_t INTEGER CHECK (gut_t BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS gut_score INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN gut_g IS NOT NULL AND gut_u IS NOT NULL AND gut_t IS NOT NULL 
      THEN gut_g * gut_u * gut_t 
      ELSE NULL 
    END
  ) STORED;

-- Index for sorting by priority
CREATE INDEX IF NOT EXISTS idx_orders_gut_score ON public.orders(gut_score DESC NULLS LAST);
