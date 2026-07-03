-- Health form fields (the "FICHA DE SAÚDE" public form is the final field list the
-- Fase 1 health_records was waiting for). Only ALTERs + one new enum here, so no new
-- table and no new RLS policy: existing policies on these tables already cover the
-- added columns. NEVER log health_records / consents (sensitive data).

-- New enum: the form carries several distinct authorizations, each stored as its own
-- consents row (versionable, queryable legal proof) instead of booleans on health_records.
create type public.consent_kind as enum (
  'lgpd_terms',                -- platform LGPD terms (gate; explicit checkbox on the web form)
  'medical_care',              -- final declaration: authorize emergency medical care
  'medication_administration', -- authorize the nurse to administer PRN medication
  'self_medication'            -- authorize the traveler to self-manage their own medication
);

-- travelers: the adolescent/missionary CPF.
alter table public.travelers add column document text;

-- guardians: second emergency phone (the form asks for two contacts).
alter table public.guardians add column phone_secondary text;

-- consents: one row per authorization kind.
alter table public.consents add column kind public.consent_kind not null default 'lgpd_terms';

-- One consent of each kind per traveler (among non-deleted rows). This replaces the
-- earlier implicit "one consent per traveler" assumption.
create unique index consents_traveler_kind_unique
  on public.consents (traveler_id, kind)
  where deleted_at is null;

-- health_records: yes/no anchors the nurse scans quickly. Multi-select lists, the
-- history grid and the medication authorizations live in `data` (single source of
-- truth, no duplication with the anchor text columns). Free-text answers reuse the
-- existing columns: health_insurance (operator/plan/card), medications (continuous-use
-- list), dietary_restrictions, and notes (info for the health team).
alter table public.health_records
  add column has_health_insurance boolean,
  add column has_medical_conditions boolean,
  add column has_allergies boolean,
  add column uses_continuous_medication boolean,
  add column needs_medication_on_trip boolean,
  add column has_physical_limitation boolean,
  add column physical_limitation_description text;

-- Structured shape of health_records.data (mirrored 1:1 by packages/core Zod):
--   {
--     "medical_conditions": [ "asthma", "diabetes", ... ],        -- page 2 checklist
--     "allergy": { "type": "food|medication|insect|other", "reaction": "...", "seafood": "..." },
--     "medications_to_carry": "...",                              -- free text
--     "medical_history": {                                        -- page 2 yes/no grid
--       "seizure": bool, "fainting": bool, "asthma_attack": bool,
--       "severe_allergic_reaction": bool, "surgery_hospitalization_12m": bool, "other": bool
--     },
--     "medical_history_notes": "...",
--     "travel_health_history": [ "motion_sickness", "heat_sensitivity", ... ],
--     "med_authorizations": {                                     -- pages 3-4 checklists
--       "analgesics": [...], "colic": [...], "nausea": [...],
--       "mild_allergy": [...], "other": [...]
--     }
--   }

-- Rebuild submit_traveler to persist the new columns and to accept an array of consents.
-- Body is identical to 0012 except: travelers.document, guardians.phone_secondary, the
-- consents loop (was a single insert), and the new health_records columns.
-- CREATE OR REPLACE preserves the existing grants (anon, authenticated) — not re-emitted.
-- Expected payload shape (aligned with packages/core):
--   {
--     "traveler":  { "id?", "full_name", "birth_date", "sex", "document", "phone", "email", "notes" },
--     "guardians": [ { "full_name", "relationship", "document", "phone", "phone_secondary", "email" } ],
--     "health":    { anchors..., "has_allergies", ..., "data": {} },       -- optional
--     "consents":  [ { "kind", "accepted", "terms_version", "ip_address", "user_agent" } ],
--     "documents": [ { "kind", "storage_path", "file_name", "mime_type", "size_bytes" } ]
--   }
-- LGPD gate: the payload must contain an accepted 'lgpd_terms' consent with a terms_version.
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
      physical_limitation_description, data
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
