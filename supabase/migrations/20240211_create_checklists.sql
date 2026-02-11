-- Create Checklist Tables

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT, -- 'Tesoura', etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  area TEXT NOT NULL, -- 'Sala', 'Cozinha', 'Suite 1'
  description TEXT NOT NULL, -- 'Vistoria de Tomadas', etc.
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.checklist_templates(id),
  user_id UUID REFERENCES auth.users(id), -- Assuming auth.users 
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.checklist_items(id),
  status TEXT NOT NULL, -- 'ok', 'issue'
  observation TEXT,
  generated_order_id UUID REFERENCES public.orders(id), -- Link to the order if issue found
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Basic for now, accessible to authenticated users)
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for auth users" ON public.checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for auth users" ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for auth users" ON public.inspections FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Enable all for auth users" ON public.inspection_results FOR ALL TO authenticated USING (true);

-- Insert Template Data for 'Tesoura'
DO $$
DECLARE
  v_template_id UUID;
BEGIN
  -- Create Template if not exists
  INSERT INTO public.checklist_templates (name, location)
  VALUES ('Vistoria Padrão - Tesoura', 'Tesoura')
  RETURNING id INTO v_template_id;

  -- Insert Items
  -- Sala
  INSERT INTO public.checklist_items (template_id, area, description, item_order) VALUES
  (v_template_id, 'Sala', 'Vistoria de Tomadas', 1),
  (v_template_id, 'Sala', 'Vistoria de Roteador de internet', 2),
  (v_template_id, 'Sala', 'Vistoria de Iluminação', 3),
  (v_template_id, 'Sala', 'Vistoria de Ventiladores', 4),
  (v_template_id, 'Sala', 'Vistoria de Abajur', 5);

  -- Cozinha
  INSERT INTO public.checklist_items (template_id, area, description, item_order) VALUES
  (v_template_id, 'Cozinha', 'Vistoria de Pias/Sifão e Válvula', 6),
  (v_template_id, 'Cozinha', 'Vistoria de Torneiras', 7),
  (v_template_id, 'Cozinha', 'Vistoria de Registros', 8),
  (v_template_id, 'Cozinha', 'Vistoria de Fluxo de água nas Torneiras', 9),
  (v_template_id, 'Cozinha', 'Vistoria de Fogão', 10),
  (v_template_id, 'Cozinha', 'Vistoria de Geladeira', 11);

  -- Suite 1
  INSERT INTO public.checklist_items (template_id, area, description, item_order) VALUES
  (v_template_id, 'Suite 1', 'Vistoria de Tomadas', 12),
  (v_template_id, 'Suite 1', 'Vistoria de Iluminação', 13),
  (v_template_id, 'Suite 1', 'Vistoria de Ventiladores', 14),
  (v_template_id, 'Suite 1', 'Vistoria de Abajur', 15),
  (v_template_id, 'Suite 1', 'TV', 16),
  (v_template_id, 'Suite 1', 'Controle', 17),
  (v_template_id, 'Suite 1', 'Frigobar', 18),
  (v_template_id, 'Suite 1', 'Torneiras dos Banheiro', 19),
  (v_template_id, 'Suite 1', 'Vaso do Banheiro', 20),
  (v_template_id, 'Suite 1', 'Chuveiro Quente do Banheiro', 21),
  (v_template_id, 'Suite 1', 'Chuveiro Frio do Banheiro', 22),
  (v_template_id, 'Suite 1', 'Disjuntores', 23),
  (v_template_id, 'Suite 1', 'Cifão do Banheiro', 24),
  (v_template_id, 'Suite 1', 'Ducha do Banheiro', 25);

  -- Suite 2
  INSERT INTO public.checklist_items (template_id, area, description, item_order) VALUES
  (v_template_id, 'Suite 2', 'Vistoria de Tomadas', 26),
  (v_template_id, 'Suite 2', 'Vistoria de Roteador de internet', 27),
  (v_template_id, 'Suite 2', 'Vistoria de Iluminação', 28),
  (v_template_id, 'Suite 2', 'Vistoria de Ventiladores', 29),
  (v_template_id, 'Suite 2', 'Vistoria de Abajur', 30),
  (v_template_id, 'Suite 2', 'TV', 31),
  (v_template_id, 'Suite 2', 'Controle', 32),
  (v_template_id, 'Suite 2', 'Frigobar', 33),
  (v_template_id, 'Suite 2', 'Torneiras dos Banheiro', 34),
  (v_template_id, 'Suite 2', 'Vaso do Banheiro', 35),
  (v_template_id, 'Suite 2', 'Chuveiro Quente do Banheiro', 36),
  (v_template_id, 'Suite 2', 'Chuveiro Frio do Banheiro', 37),
  (v_template_id, 'Suite 2', 'Disjuntores', 38),
  (v_template_id, 'Suite 2', 'Cifão do Banheiro', 39),
  (v_template_id, 'Suite 2', 'Ducha do Banheiro', 40);

  -- Suite 3
  INSERT INTO public.checklist_items (template_id, area, description, item_order) VALUES
  (v_template_id, 'Suite 3', 'Vistoria de Tomadas', 41),
  (v_template_id, 'Suite 3', 'Vistoria de Iluminação', 42),
  (v_template_id, 'Suite 3', 'Vistoria de Ventiladores', 43),
  (v_template_id, 'Suite 3', 'Vistoria de Abajur', 44),
  (v_template_id, 'Suite 3', 'TV', 45);

END $$;
