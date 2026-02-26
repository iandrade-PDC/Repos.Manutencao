-- Update Water Meter Points with specific names provided by user
-- First, clean up existing water points (to avoid duplicates or stale generic names)
DELETE FROM public.meter_points WHERE type = 'water';

-- Insert new points
INSERT INTO public.meter_points (name, type, display_order) VALUES
('Geral', 'water', 1),
('Governança', 'water', 2),
('Praia', 'water', 3),
('Bomba', 'water', 4),
('Ancoradouro', 'water', 5),
('Estação', 'water', 6),
('Tesoura', 'water', 7),
('Maria Praça', 'water', 8),
('Maria Rio', 'water', 9),
('Igreja', 'water', 10),
('Coqueiro', 'water', 11),
('Cajueiro', 'water', 12),
('Cobogó', 'water', 13);
