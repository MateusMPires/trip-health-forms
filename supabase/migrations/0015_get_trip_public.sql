-- Public, anon-callable lookup for the registration landing screen.
-- The public form must never SELECT trips (CLAUDE.md), yet it needs to validate the access
-- code and show the trip's name before rendering the wizard. This SECURITY DEFINER function
-- returns ONLY the trip name for an active, non-deleted trip, and null otherwise — it never
-- exposes organization_id / trip_id (which the public form must not learn).
create or replace function public.get_trip_public(p_code char(6))
returns text
language sql
security definer
stable
set search_path = public
as $$
  select name
  from public.trips
  where access_code = p_code
    and status = 'active'
    and deleted_at is null
  limit 1;
$$;

-- Same grant pattern as submit_traveler: anonymous form + logged-in leaders.
revoke all on function public.get_trip_public(char) from public;
grant execute on function public.get_trip_public(char) to anon, authenticated;
