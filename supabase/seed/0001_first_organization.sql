-- Seed: first organization + an example trip with a fixed access code, for
-- local/dev bootstrapping. Not applied by `db push`; run manually or via
-- `supabase db reset` (local). Idempotent.
insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Missão Exemplo')
on conflict (id) do nothing;

insert into public.trips (id, organization_id, name, access_code, status)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Viagem de Exemplo',
  '123456',
  'active'
)
on conflict (id) do nothing;
