-- Dietary restriction becomes a yes/no question, so it needs its own boolean flag paired
-- with the existing free-text column (same has_X + X_detail idiom as the other health
-- questions). Only an ALTER + a submit_traveler rebuild — no new table, no new RLS policy
-- (existing health_records policies already cover the added column). NEVER log this table.

alter table public.health_records add column has_dietary_restriction boolean;

-- Rebuild submit_traveler to persist has_dietary_restriction. Body is identical to 0014
-- except the added column in the health_records insert. CREATE OR REPLACE preserves grants.
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
  v_consent jsonb;
  v_document jsonb;
  v_has_lgpd boolean := false;
begin
  select * into v_trip
  from public.trips
  where access_code = p_code
    and status = 'active'
    and deleted_at is null;

  if not found then
    raise exception 'invalid access code';
  end if;

  -- LGPD gate: require an accepted 'lgpd_terms' consent with a non-empty terms_version.
  for v_consent in
    select * from jsonb_array_elements(coalesce(p_payload -> 'consents', '[]'::jsonb))
  loop
    if v_consent ->> 'kind' = 'lgpd_terms'
       and coalesce((v_consent ->> 'accepted')::boolean, false) is true
       and coalesce(v_consent ->> 'terms_version', '') <> '' then
      v_has_lgpd := true;
    end if;
  end loop;

  if not v_has_lgpd then
    raise exception 'consent is required';
  end if;

  v_traveler_id := coalesce((p_payload #>> '{traveler,id}')::uuid, gen_random_uuid());

  insert into public.travelers (
    id, organization_id, trip_id, full_name, birth_date, sex,
    document, phone, email, notes, submitted_via
  )
  values (
    v_traveler_id,
    v_trip.organization_id,
    v_trip.id,
    p_payload #>> '{traveler,full_name}',
    (p_payload #>> '{traveler,birth_date}')::date,
    (p_payload #>> '{traveler,sex}')::public.traveler_sex,
    p_payload #>> '{traveler,document}',
    p_payload #>> '{traveler,phone}',
    p_payload #>> '{traveler,email}',
    p_payload #>> '{traveler,notes}',
    'public_form'
  );

  -- One consents row per authorization kind.
  for v_consent in
    select * from jsonb_array_elements(coalesce(p_payload -> 'consents', '[]'::jsonb))
  loop
    insert into public.consents (
      traveler_id, trip_id, kind, accepted, terms_version, accepted_at, ip_address, user_agent
    )
    values (
      v_traveler_id,
      v_trip.id,
      (v_consent ->> 'kind')::public.consent_kind,
      coalesce((v_consent ->> 'accepted')::boolean, false),
      v_consent ->> 'terms_version',
      now(),
      nullif(v_consent ->> 'ip_address', '')::inet,
      v_consent ->> 'user_agent'
    );
  end loop;

  for v_guardian in
    select * from jsonb_array_elements(coalesce(p_payload -> 'guardians', '[]'::jsonb))
  loop
    insert into public.guardians (
      traveler_id, trip_id, full_name, relationship, document, phone, phone_secondary, email
    )
    values (
      v_traveler_id,
      v_trip.id,
      v_guardian ->> 'full_name',
      v_guardian ->> 'relationship',
      v_guardian ->> 'document',
      v_guardian ->> 'phone',
      v_guardian ->> 'phone_secondary',
      v_guardian ->> 'email'
    );
  end loop;

  if p_payload ? 'health' and jsonb_typeof(p_payload -> 'health') = 'object' then
    v_health := p_payload -> 'health';
    insert into public.health_records (
      traveler_id, trip_id, blood_type, allergies, medications,
      medical_conditions, dietary_restrictions, health_insurance, notes,
      has_health_insurance, has_medical_conditions, has_allergies,
      uses_continuous_medication, needs_medication_on_trip, has_physical_limitation,
      has_dietary_restriction, physical_limitation_description, data
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
      (v_health ->> 'has_health_insurance')::boolean,
      (v_health ->> 'has_medical_conditions')::boolean,
      (v_health ->> 'has_allergies')::boolean,
      (v_health ->> 'uses_continuous_medication')::boolean,
      (v_health ->> 'needs_medication_on_trip')::boolean,
      (v_health ->> 'has_physical_limitation')::boolean,
      (v_health ->> 'has_dietary_restriction')::boolean,
      v_health ->> 'physical_limitation_description',
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
