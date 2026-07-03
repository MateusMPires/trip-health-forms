-- Guardian(s) for minors (0..N per traveler). The "minor requires guardian"
-- rule is validated in packages/core, not as a cross-table constraint.
create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  trip_id uuid not null references public.trips(id),
  full_name text not null,
  relationship text,
  document text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.guardians enable row level security;

create trigger guardians_set_updated_at
  before update on public.guardians
  for each row execute function public.set_updated_at();

create index guardians_traveler_id_idx on public.guardians (traveler_id);
create index guardians_trip_id_idx on public.guardians (trip_id);

create policy "guardians_select_members"
  on public.guardians for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "guardians_insert_admins"
  on public.guardians for insert
  to authenticated
  with check (public.is_trip_admin(trip_id));

create policy "guardians_update_admins"
  on public.guardians for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "guardians_delete_admins"
  on public.guardians for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
