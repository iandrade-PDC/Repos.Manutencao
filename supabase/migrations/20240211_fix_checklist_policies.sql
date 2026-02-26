-- Fix RLS policies for checklists to allow Create/Update/Delete
-- Previously only SELECT was allowed, preventing template creation, editing, and deletion (archiving).

-- Drop existing policies to be safe/clean
DROP POLICY IF EXISTS "Enable read for auth users" ON public.checklist_templates;
DROP POLICY IF EXISTS "Enable read for auth users" ON public.checklist_items;

-- checklist_templates Policies
CREATE POLICY "Enable read for auth users" ON public.checklist_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for auth users" ON public.checklist_templates
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for auth users" ON public.checklist_templates
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for auth users" ON public.checklist_templates
    FOR DELETE TO authenticated USING (true);

-- checklist_items Policies
CREATE POLICY "Enable read for auth users" ON public.checklist_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for auth users" ON public.checklist_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for auth users" ON public.checklist_items
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for auth users" ON public.checklist_items
    FOR DELETE TO authenticated USING (true);

-- Ensure inspections are okay too (already exist but good to double check)
-- Existing: "Enable all for auth users" for inspections (USING auth.uid() = user_id)
-- BUT: Leaders/Admins need to see ALL inspections, not just their own.
DROP POLICY IF EXISTS "Enable all for auth users" ON public.inspections;

CREATE POLICY "Enable insert for auth users" ON public.inspections
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read for all auth users" ON public.inspections
    FOR SELECT TO authenticated USING (true); -- Everyone can see inspections (or restriction to admin/leader/creator)

CREATE POLICY "Enable update for all auth users" ON public.inspections
    FOR UPDATE TO authenticated USING (true);

