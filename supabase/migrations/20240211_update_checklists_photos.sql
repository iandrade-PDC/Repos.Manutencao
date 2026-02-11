-- Add photo column to results if not exists
ALTER TABLE public.inspection_results 
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Enable Storage for Checklist Photos if not already set
insert into storage.buckets (id, name, public)
values ('checklist-photos', 'checklist-photos', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'checklist-photos' );

create policy "Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'checklist-photos' AND auth.role() = 'authenticated' );
