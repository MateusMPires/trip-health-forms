-- User<->trip link carrying the per-trip role. A user may be an administrator
-- on one trip and a collaborator on another.
create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references public.profiles(id),
  role public.member_role not null default 'collaborator',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.trip_members enable row level security;

create trigger trip_members_set_updated_at
  before update on public.trip_members
  for each row execute function public.set_updated_at();

create unique index trip_members_trip_user_unique
  on public.trip_members (trip_id, user_id)
  where deleted_at is null;

create index trip_members_user_id_idx on public.trip_members (user_id);
create index trip_members_trip_id_idx on public.trip_members (trip_id);

-- Read your own memberships; trip admins read the whole roster.
create policy "trip_members_select_self_or_admin"
  on public.trip_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_trip_admin(trip_id));

-- Admins manage membership. Self-service join happens through join_trip()
-- (SECURITY DEFINER), so no authenticated INSERT policy is exposed here.
create policy "trip_members_update_admins"
  on public.trip_members for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "trip_members_delete_admins"
  on public.trip_members for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
