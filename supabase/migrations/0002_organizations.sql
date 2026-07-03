-- Tenant root. The first organization is created via seed / service role;
-- there is no authenticated INSERT path in this phase.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.organizations enable row level security;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- Members of any trip in the org can read the org row.
create policy "organizations_select_members"
  on public.organizations for select
  to authenticated
  using (public.is_org_member(id));
