// Postgres enums mirrored from supabase/migrations. Keep in sync with the DB.

export const TRAVELER_SEX = ['male', 'female', 'other', 'prefer_not_say'] as const;
export type TravelerSex = (typeof TRAVELER_SEX)[number];

// The form types "xx" into the guardian name/document fields for travelers aged 18+ (no legal
// guardian). Shared so both the "responsible guardian" rule and the CPF validation know it.
export const GUARDIAN_ABSENT_SENTINEL = 'xx';

// `commitment_term` and `national_travel_authorization` are uploaded by trip admins from the
// mobile app (migration 0017); the public form never issues them.
export const DOCUMENT_KINDS = [
  'identity_document',
  'authorization',
  'photo',
  'commitment_term',
  'national_travel_authorization',
  'other',
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

// `group_leader` (migration 0018) is a collaborator that can additionally file and
// edit evangelism reports; one role per membership.
export const MEMBER_ROLES = ['collaborator', 'administrator', 'group_leader'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const TRIP_STATUSES = ['draft', 'active', 'archived'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

// consent_kind (migration 0014). Each authorization in the health form is one row.
export const CONSENT_KINDS = [
  'lgpd_terms',
  'medical_care',
  'medication_administration',
  'self_medication',
] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

// The two consents the public submission must carry accepted (LGPD + medical care).
export const REQUIRED_CONSENT_KINDS = ['lgpd_terms', 'medical_care'] as const;
