-- 1:1 mirror of auth.users for leaders (Google login). Rows are created by the
-- handle_new_user() trigger when an auth user is created.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Read your own profile, plus profiles of people you share a trip with
-- (needed to display documents.uploaded_by).
create policy "profiles_select_self_or_shared"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.shares_trip_with_current_user(id));

-- Update only your own profile.
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Create the profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
