-- LGPD consent record. Required to persist health / minor data (enforced by
-- submit_traveler()). Stores legal proof of acceptance.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  trip_id uuid not null references public.trips(id),
  accepted boolean not null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.consents enable row level security;

create trigger consents_set_updated_at
  before update on public.consents
  for each row execute function public.set_updated_at();

create index consents_traveler_id_idx on public.consents (traveler_id);
create index consents_trip_id_idx on public.consents (trip_id);

create policy "consents_select_members"
  on public.consents for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "consents_insert_admins"
  on public.consents for insert
  to authenticated
  with check (public.is_trip_admin(trip_id));

create policy "consents_update_admins"
  on public.consents for update
  to authenticated
  using (public.is_trip_admin(trip_id))
  with check (public.is_trip_admin(trip_id));

create policy "consents_delete_admins"
  on public.consents for delete
  to authenticated
  using (public.is_trip_admin(trip_id));
