-- The traveler. organization_id and trip_id are denormalized (filled by the
-- write RPC / admin) for fast RLS and Storage path assembly.
-- is_minor is NOT a stored column: it depends on a non-immutable reference
-- date, so it is computed in packages/core (is_minor(birth_date, reference)).
create table public.travelers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  trip_id uuid not null references public.trips(id),
  full_name text not null,
  birth_date date,
  sex public.traveler_sex,
  phone text,
  email text,
  notes text,
  submitted_via text check (submitted_via in ('public_form', 'app')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.travelers enable row level security;

create trigger travelers_set_updated_at
  before update on public.travelers
  for each row execute function public.set_updated_at();

create index travelers_trip_id_idx on public.travelers (trip_id);
create index travelers_organization_id_idx on public.travelers (organization_id);

-- Leaders read; trip admins write. Public submissions go through
-- submit_traveler() (SECURITY DEFINER), never a direct anon INSERT.
create policy "travelers_select_members"
  on public.travelers for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "travelers_insert_admins"
  on public.travelers for insert
  to authenticated
  with check (public.is_trip_admin(trip_id));

create policy "travelers_update_admins"
  on public.travelers for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "travelers_delete_admins"
  on public.travelers for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
