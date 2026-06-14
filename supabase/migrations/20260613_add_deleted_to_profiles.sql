-- Add deleted flag to profiles for soft delete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Allow admin and technically TI people to delete tickets
-- Assuming we want `tecnico` or `admin` to delete.
-- The policy checks if user is_ti_tecnico()
CREATE POLICY "ti_chamados_delete"
  ON public.ti_chamados FOR DELETE
  TO authenticated
  USING (public.is_ti_tecnico());
