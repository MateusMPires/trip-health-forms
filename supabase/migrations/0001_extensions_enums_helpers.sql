-- Extensions, enums, and shared helper functions.
-- Foundation for every other migration. RLS helpers live here as SECURITY
-- DEFINER plpgsql functions so per-table policies only reference functions,
-- which (a) avoids RLS recursion (the function owner bypasses RLS) and
-- (b) lets the helpers reference tables created in later migrations, since
-- plpgsql bodies are resolved at runtime, not at CREATE time.

-- Extensions ----------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- Enums ---------------------------------------------------------------------
create type public.member_role as enum ('collaborator', 'administrator');
create type public.traveler_sex as enum ('male', 'female', 'other', 'prefer_not_say');
create type public.document_kind as enum ('identity_document', 'authorization', 'photo', 'other');
create type public.trip_status as enum ('draft', 'active', 'archived');

-- updated_at trigger function -----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS helper functions ------------------------------------------------------
-- All are SECURITY DEFINER (owner = migration role, which owns the tables and
-- therefore bypasses RLS), preventing policy recursion on trip_members.

create or replace function public.is_trip_member(p_trip_id uuid)
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
      and tm.deleted_at is null
  );
end;
$$;

create or replace function public.is_trip_admin(p_trip_id uuid)
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
      and tm.role = 'administrator'
      and tm.deleted_at is null
  );
end;
$$;

create or replace function public.is_org_member(p_organization_id uuid)
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
    join public.trips t on t.id = tm.trip_id
    where t.organization_id = p_organization_id
      and tm.user_id = auth.uid()
      and tm.deleted_at is null
      and t.deleted_at is null
  );
end;
$$;

create or replace function public.shares_trip_with_current_user(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.trip_members me
    join public.trip_members other on other.trip_id = me.trip_id
    where me.user_id = auth.uid()
      and other.user_id = p_user_id
      and me.deleted_at is null
      and other.deleted_at is null
  );
end;
$$;
