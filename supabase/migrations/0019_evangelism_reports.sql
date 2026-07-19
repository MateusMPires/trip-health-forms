-- Evangelism reports: daily evangelism counters filed by a group leader for a
-- trip. Aggregate numbers only — no personal data of the people evangelized, so
-- this table stays outside the sensitive-data scope (health/minors).
--
-- report_date is the day the numbers are about; created_at/updated_at record
-- when the row was filled/edited (filling yesterday's report today ⇒
-- report_date = yesterday, created_at = today).

-- Helper: is the current user a group_leader of this trip? SECURITY DEFINER (owner
-- bypasses RLS, avoiding recursion on trip_members), search_path pinned per 0013.
create or replace function public.is_group_leader(p_trip_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = auth.uid()
      and tm.role = 'group_leader'
      and tm.deleted_at is null
  );
end;
$$;

-- Internal RLS helper, not an RPC endpoint: drop the default anon grant (0013).
revoke execute on function public.is_group_leader(uuid) from public, anon;
grant execute on function public.is_group_leader(uuid) to authenticated, service_role;

-- Rejects a report whose day falls outside the trip window. The client only
-- offers in-window days, but an offline client could still post a bad date.
create or replace function public.check_report_within_trip_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
begin
  select starts_at, ends_at into t from public.trips where id = new.trip_id;
  if t.starts_at is not null and new.report_date < t.starts_at then
    raise exception 'report_date % is before trip start %', new.report_date, t.starts_at;
  end if;
  if t.ends_at is not null and new.report_date > t.ends_at then
    raise exception 'report_date % is after trip end %', new.report_date, t.ends_at;
  end if;
  return new;
end;
$$;

create table public.evangelism_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  trip_id uuid not null references public.trips(id),
  author_id uuid not null references public.profiles(id),
  report_date date not null,
  approaches int not null default 0 check (approaches >= 0),
  gospel_presentations int not null default 0 check (gospel_presentations >= 0),
  professions_of_faith int not null default 0 check (professions_of_faith >= 0),
  reconciliations int not null default 0 check (reconciliations >= 0),
  referrals int not null default 0 check (referrals >= 0),
  prayer_requests int not null default 0 check (prayer_requests >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.evangelism_reports enable row level security;

create trigger evangelism_reports_set_updated_at
  before update on public.evangelism_reports
  for each row execute function public.set_updated_at();

create trigger evangelism_reports_check_window
  before insert or update on public.evangelism_reports
  for each row execute function public.check_report_within_trip_window();

-- One report per (trip, author, day) among non-deleted rows; re-filing a day is
-- an upsert on this key.
create unique index evangelism_reports_trip_author_date_uniq
  on public.evangelism_reports (trip_id, author_id, report_date)
  where deleted_at is null;

create index evangelism_reports_trip_id_idx on public.evangelism_reports (trip_id);
create index evangelism_reports_author_id_idx on public.evangelism_reports (author_id);

-- Group leaders and trip admins read the trip's reports (consolidated view).
create policy "evangelism_reports_select_leaders_admins"
  on public.evangelism_reports for select
  to authenticated
  using (public.is_group_leader(trip_id) or public.is_trip_admin(trip_id));

-- Only a group leader files reports, and only under their own author_id.
create policy "evangelism_reports_insert_own"
  on public.evangelism_reports for insert
  to authenticated
  with check (public.is_group_leader(trip_id) and author_id = auth.uid());

create policy "evangelism_reports_update_own"
  on public.evangelism_reports for update
  to authenticated
  using (public.is_group_leader(trip_id) and author_id = auth.uid())
  with check (public.is_group_leader(trip_id) and author_id = auth.uid());

create policy "evangelism_reports_delete_own"
  on public.evangelism_reports for delete
  to authenticated
  using (public.is_group_leader(trip_id) and author_id = auth.uid());
