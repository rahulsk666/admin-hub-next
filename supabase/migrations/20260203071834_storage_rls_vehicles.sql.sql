-- ===========================================
-- Vehicles bucket RLS policies
-- ===========================================

-- SELECT
create policy "vehicles: authenticated users can select"
on storage.objects
FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'vehicles' 
    AND auth.role() = 'authenticated'
);

-- INSERT (upload)
create policy "vehicles: authenticated users can upload"
on storage.objects
for INSERT
to authenticated
with check (
  bucket_id = 'vehicles'
  and auth.role() = 'authenticated'
);

-- UPDATE (rename / replace)
create policy "vehicles: authenticated users can update"
on storage.objects
for UPDATE
to authenticated
USING (
  bucket_id = 'vehicles'
  and auth.role() = 'authenticated'
);
