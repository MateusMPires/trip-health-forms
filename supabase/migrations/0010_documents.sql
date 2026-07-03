-- File metadata (documents, authorizations, photos). Binaries live in Storage
-- (bucket traveler-files); this table only holds the pointer + metadata.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  trip_id uuid not null references public.trips(id),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  kind public.document_kind not null default 'other',
  storage_bucket text not null default 'traveler-files',
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.documents enable row level security;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create index documents_traveler_id_idx on public.documents (traveler_id);
create index documents_trip_id_idx on public.documents (trip_id);
create index documents_organization_id_idx on public.documents (organization_id);

create policy "documents_select_members"
  on public.documents for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "documents_insert_admins"
  on public.documents for insert
  to authenticated
  with check (public.is_trip_admin(trip_id));

create policy "documents_update_admins"
  on public.documents for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "documents_delete_admins"
  on public.documents for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
