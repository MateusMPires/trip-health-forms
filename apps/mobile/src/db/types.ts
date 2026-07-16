// Row shapes as read back from the local mirror (SQLite has no booleans — flags come
// back as 0/1/null and are exposed here as `number | null`; use `toBool` to read them).
import type {
  ConsentKind,
  DocumentKind,
  MemberRole,
  TravelerSex,
  TripStatus,
} from '@viagem/core';

export type TripRow = {
  id: string;
  organization_id: string;
  name: string;
  access_code: string;
  status: TripStatus;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

export type TripMemberRow = {
  id: string;
  trip_id: string;
  user_id: string;
  role: MemberRole;
  updated_at: string;
};

export type TravelerRow = {
  id: string;
  organization_id: string;
  trip_id: string;
  full_name: string;
  birth_date: string | null;
  sex: TravelerSex | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  updated_at: string;
};

export type GuardianRow = {
  id: string;
  traveler_id: string;
  full_name: string;
  relationship: string | null;
  document: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
};

export type HealthRecordRow = {
  id: string;
  traveler_id: string;
  blood_type: string | null;
  has_medical_conditions: number | null;
  medical_conditions: string | null;
  has_allergies: number | null;
  allergies: string | null;
  uses_continuous_medication: number | null;
  medications: string | null;
  needs_medication_on_trip: number | null;
  has_dietary_restriction: number | null;
  dietary_restrictions: string | null;
  has_physical_limitation: number | null;
  physical_limitation_description: string | null;
  has_health_insurance: number | null;
  health_insurance: string | null;
  notes: string | null;
  data: string;
};

export type ConsentRow = {
  id: string;
  traveler_id: string;
  kind: ConsentKind;
  accepted: number;
  accepted_at: string;
  terms_version: string;
};

export type DocumentRow = {
  id: string;
  organization_id: string;
  trip_id: string;
  traveler_id: string;
  kind: DocumentKind;
  storage_bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  local_path: string | null;
  cached_at: string | null;
  /** Local-only: 1 while the binary + row still need pushing to the server (offline outbox). */
  pending_upload: number | null;
};

export function toBool(value: number | null | undefined): boolean | null {
  if (value == null) return null;
  return value !== 0;
}
