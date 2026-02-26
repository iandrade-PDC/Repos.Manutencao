-- Create a table to manage meter definitions (Water names, Gas points, etc)
CREATE TABLE IF NOT EXISTS public.meter_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'water', 'gas', 'energy'
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.meter_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated" ON public.meter_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for admin/leader" ON public.meter_points FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'leader', 'service_role'));

-- Seed initial data
-- 10 Water Points
INSERT INTO public.meter_points (name, type, display_order) VALUES
('Hidrômetro Geral', 'water', 1),
('Hidrômetro Secundário', 'water', 2),
('Hidrômetro 03', 'water', 3),
('Hidrômetro 04', 'water', 4),
('Hidrômetro 05', 'water', 5),
('Hidrômetro 06', 'water', 6),
('Hidrômetro 07', 'water', 7),
('Hidrômetro 08', 'water', 8),
('Hidrômetro 09', 'water', 9),
('Hidrômetro 10', 'water', 10);

-- 2 Gas Points (replacing the single % check)
INSERT INTO public.meter_points (name, type, display_order) VALUES
('Gás P13 - 1', 'gas', 1),
('Gás P13 - 2', 'gas', 2);
