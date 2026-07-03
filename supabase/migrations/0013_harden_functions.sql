-- Security hardening for the advisor warnings raised after 0001-0012.
-- (No schema/behaviour change; only search_path pinning and EXECUTE grants.)

-- 1) Pin search_path on the two functions that were still role-mutable.
alter function public.set_updated_at() set search_path = public;
alter function public.generate_trip_access_code() set search_path = public;

-- 2) Internal RLS helpers must NOT be public RPC endpoints. Supabase's default
--    privileges grant EXECUTE to anon on every new public function, so we revoke
--    it (from PUBLIC and anon) and keep only the roles that actually need it:
--    authenticated (RLS policies call these) and service_role.
revoke execute on function public.is_trip_member(uuid) from public, anon;
grant execute on function public.is_trip_member(uuid) to authenticated, service_role;

revoke execute on function public.is_trip_admin(uuid) from public, anon;
grant execute on function public.is_trip_admin(uuid) to authenticated, service_role;

revoke execute on function public.is_org_member(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;

revoke execute on function public.shares_trip_with_current_user(uuid) from public, anon;
grant execute on function public.shares_trip_with_current_user(uuid) to authenticated, service_role;

-- 3) join_trip is for signed-in leaders only; drop the anon grant.
revoke execute on function public.join_trip(char) from anon;

-- Note: submit_traveler intentionally keeps its anon grant (public form is
-- anonymous). handle_new_user returns `trigger` and is not RPC-callable, so its
-- warning is not exploitable and is left untouched to avoid auth-flow risk.
