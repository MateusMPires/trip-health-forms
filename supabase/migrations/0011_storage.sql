-- Private bucket for traveler files. No public read; access is always via
-- signed URLs issued server-side.
insert into storage.buckets (id, name, public)
values ('traveler-files', 'traveler-files', false)
on conflict (id) do nothing;

-- Path convention:
--   {organization_id}/{trip_id}/{traveler_id}/{kind}/{uuid}-{filename}
-- foldername(name)[2] = trip_id, so access is scoped to the exact trip
-- (tighter than org-level: a member of trip A can't read trip B in the same org).

-- Trip members can read their trip's files (signed download URLs).
create policy "traveler_files_select_members"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'traveler-files'
    and public.is_trip_member(((storage.foldername(name))[2])::uuid)
  );

-- Trip admins can upload / update / delete their trip's files from the app.
-- Public-form uploads go through the request-upload-url Edge Function using the
-- service role, which bypasses these policies.
create policy "traveler_files_insert_admins"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'traveler-files'
    and public.is_trip_admin(((storage.foldername(name))[2])::uuid)
  );

create policy "traveler_files_update_admins"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'traveler-files'
    and public.is_trip_admin(((storage.foldername(name))[2])::uuid)
  );

create policy "traveler_files_delete_admins"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'traveler-files'
    and public.is_trip_admin(((storage.foldername(name))[2])::uuid)
  );
