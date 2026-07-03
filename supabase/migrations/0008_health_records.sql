-- Health data. Flexible for now: anchor columns + `data` jsonb until the final
-- field list arrives. NEVER log this table (health = sensitive data).
create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  trip_id uuid not null references public.trips(id),
  blood_type text,
  allergies text,
  medications text,
  medical_conditions text,
  dietary_restrictions text,
  health_insurance text,
  notes text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.health_records enable row level security;

create trigger health_records_set_updated_at
  before update on public.health_records
  for each row execute function public.set_updated_at();

-- One health record per traveler (among non-deleted rows).
create unique index health_records_traveler_unique
  on public.health_records (traveler_id)
  where deleted_at is null;

create index health_records_trip_id_idx on public.health_records (trip_id);

create policy "health_records_select_members"
  on public.health_records for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "health_records_insert_admins"
  on public.health_records for insert
  to authenticated
  with check (public.is_trip_admin(trip_id));

create policy "health_records_update_admins"
  on public.health_records for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "health_records_delete_admins"
  on public.health_records for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
