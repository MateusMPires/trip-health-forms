-- Public / self-service RPCs. Both are SECURITY DEFINER (run as the table
-- owner, bypassing RLS) so the public form can write without any anon INSERT
-- policy, and joining a trip can insert a membership for the caller.

-- join_trip(code): a logged-in leader joins a trip by its access code.
create or replace function public.join_trip(p_code char(6))
returns public.trip_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips;
  v_member public.trip_members;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_trip
  from public.trips
  where access_code = p_code
    and status <> 'archived'
    and deleted_at is null;

  if not found then
    raise exception 'invalid access code';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip.id, auth.uid(), 'collaborator')
  on conflict (trip_id, user_id) where deleted_at is null do nothing
  returning * into v_member;

  -- Already a member: return the existing row.
  if v_member.id is null then
    select * into v_member
    from public.trip_members
    where trip_id = v_trip.id
      and user_id = auth.uid()
      and deleted_at is null;
  end if;

  return v_member;
end;
$$;

-- submit_traveler(code, payload): atomic public-form submission.
-- Validates the access code, requires an accepted consent, then inserts the
-- traveler + guardians + health_record + consent + documents in one transaction.
-- Expected payload shape (aligned with the forthcoming packages/core schema):
--   {
--     "traveler":  { "id?", "full_name", "birth_date", "sex", "phone", "email", "notes" },
--     "guardians": [ { "full_name", "relationship", "document", "phone", "email" } ],
--     "health":    { "blood_type", "allergies", ..., "data": {} },        -- optional
--     "consent":   { "accepted", "terms_version", "ip_address", "user_agent" },
--     "documents": [ { "kind", "storage_path", "file_name", "mime_type", "size_bytes" } ]
--   }
-- The client pre-generates traveler.id so Storage uploads and this insert match.
create or replace function public.submit_traveler(p_code char(6), p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips;
  v_traveler_id uuid;
  v_health jsonb;
  v_guardian jsonb;
  v_document jsonb;
begin
  select * into v_trip
  from public.trips
  where access_code = p_code
    and status = 'active'
    and deleted_at is null;

  if not found then
    raise exception 'invalid access code';
  end if;

  -- Consent is mandatory (LGPD).
  if coalesce((p_payload #>> '{consent,accepted}')::boolean, false) is not true then
    raise exception 'consent is required';
  end if;
  if coalesce(p_payload #>> '{consent,terms_version}', '') = '' then
    raise exception 'consent terms_version is required';
  end if;

  v_traveler_id := coalesce((p_payload #>> '{traveler,id}')::uuid, gen_random_uuid());

  insert into public.travelers (
    id, organization_id, trip_id, full_name, birth_date, sex,
    phone, email, notes, submitted_via
  )
  values (
    v_traveler_id,
    v_trip.organization_id,
    v_trip.id,
    p_payload #>> '{traveler,full_name}',
    (p_payload #>> '{traveler,birth_date}')::date,
    (p_payload #>> '{traveler,sex}')::public.traveler_sex,
    p_payload #>> '{traveler,phone}',
    p_payload #>> '{traveler,email}',
    p_payload #>> '{traveler,notes}',
    'public_form'
  );

  insert into public.consents (
    traveler_id, trip_id, accepted, terms_version, accepted_at, ip_address, user_agent
  )
  values (
    v_traveler_id,
    v_trip.id,
    true,
    p_payload #>> '{consent,terms_version}',
    now(),
    nullif(p_payload #>> '{consent,ip_address}', '')::inet,
    p_payload #>> '{consent,user_agent}'
  );

  for v_guardian in
    select * from jsonb_array_elements(coalesce(p_payload -> 'guardians', '[]'::jsonb))
  loop
    insert into public.guardians (
      traveler_id, trip_id, full_name, relationship, document, phone, email
    )
    values (
      v_traveler_id,
      v_trip.id,
      v_guardian ->> 'full_name',
      v_guardian ->> 'relationship',
      v_guardian ->> 'document',
      v_guardian ->> 'phone',
      v_guardian ->> 'email'
    );
  end loop;

  if p_payload ? 'health' and jsonb_typeof(p_payload -> 'health') = 'object' then
    v_health := p_payload -> 'health';
    insert into public.health_records (
      traveler_id, trip_id, blood_type, allergies, medications,
      medical_conditions, dietary_restrictions, health_insurance, notes, data
    )
    values (
      v_traveler_id,
      v_trip.id,
      v_health ->> 'blood_type',
      v_health ->> 'allergies',
      v_health ->> 'medications',
      v_health ->> 'medical_conditions',
      v_health ->> 'dietary_restrictions',
      v_health ->> 'health_insurance',
      v_health ->> 'notes',
      coalesce(v_health -> 'data', '{}'::jsonb)
    );
  end if;

  for v_document in
    select * from jsonb_array_elements(coalesce(p_payload -> 'documents', '[]'::jsonb))
  loop
    insert into public.documents (
      organization_id, trip_id, traveler_id, kind,
      storage_bucket, storage_path, file_name, mime_type, size_bytes, uploaded_by
    )
    values (
      v_trip.organization_id,
      v_trip.id,
      v_traveler_id,
      coalesce((v_document ->> 'kind')::public.document_kind, 'other'),
      coalesce(v_document ->> 'storage_bucket', 'traveler-files'),
      v_document ->> 'storage_path',
      v_document ->> 'file_name',
      v_document ->> 'mime_type',
      (v_document ->> 'size_bytes')::bigint,
      null
    );
  end loop;

  return v_traveler_id;
end;
$$;

-- Grants: public form is anonymous; joining a trip requires a login.
revoke all on function public.submit_traveler(char, jsonb) from public;
grant execute on function public.submit_traveler(char, jsonb) to anon, authenticated;

revoke all on function public.join_trip(char) from public;
grant execute on function public.join_trip(char) to authenticated;
