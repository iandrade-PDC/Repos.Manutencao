-- Create tables for Daily Routine feature

-- 1. Table for numeric readings (Water, Gas, etc.)
CREATE TABLE IF NOT EXISTS public.daily_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    type TEXT NOT NULL,         -- 'water', 'gas', 'energy'
    location TEXT NOT NULL,     -- 'Hidrômetro Geral', 'Tanque Gás P13', etc.
    value NUMERIC NOT NULL,     -- The reading value
    unit TEXT,                  -- 'm³', '%', 'Kg'
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for standard daily tasks (Checkboxes)
CREATE TABLE IF NOT EXISTS public.daily_tasks_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    task_slug TEXT NOT NULL,    -- 'trash', 'insecticide', 'pool'
    status BOOLEAN DEFAULT FALSE,
    observation TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, task_slug) -- Ensures we don't have duplicate logs for same task same day
);

-- RLS Policies
ALTER TABLE public.daily_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks_log ENABLE ROW LEVEL SECURITY;

-- Readings Policies
CREATE POLICY "Enable read for authenticated" ON public.daily_readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated" ON public.daily_readings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for owners" ON public.daily_readings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Enable read for authenticated" ON public.daily_tasks_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated" ON public.daily_tasks_log FOR INSERT TO authenticated WITH CHECK (true); -- Allow upsert
CREATE POLICY "Enable update for authenticated" ON public.daily_tasks_log FOR UPDATE TO authenticated USING (true);
