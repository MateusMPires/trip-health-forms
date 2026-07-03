-- A trip belongs to an organization. access_code is the public form key.

-- 6-digit access code generator with retry on collision (among non-deleted
-- trips). Defined before the table; the plpgsql body is resolved at runtime.
create or replace function public.generate_trip_access_code()
returns char(6)
language plpgsql
as $$
declare
  v_code char(6);
begin
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.trips
      where access_code = v_code and deleted_at is null
    );
  end loop;
  return v_code;
end;
$$;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  access_code char(6) not null default public.generate_trip_access_code(),
  status public.trip_status not null default 'active',
  starts_at date,
  ends_at date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.trips enable row level security;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create unique index trips_access_code_unique
  on public.trips (access_code)
  where deleted_at is null;

create index trips_organization_id_idx on public.trips (organization_id);

-- Members can read their trips.
create policy "trips_select_members"
  on public.trips for select
  to authenticated
  using (public.is_trip_member(id));

-- Trip admins can update / soft-delete. Creating a trip is service-role / seed
-- only in this phase (a brand-new trip has no members to be admin yet).
create policy "trips_update_admins"
  on public.trips for update
  to authenticated
  using (public.is_trip_admin(id))
  with check (public.is_trip_admin(id));

create policy "trips_delete_admins"
  on public.trips for delete
  to authenticated
  using (public.is_trip_admin(id));
