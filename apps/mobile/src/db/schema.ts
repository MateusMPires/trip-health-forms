// Local SQLite schema — a read-only mirror of the Supabase tables the RLS lets the
// leader see, plus sync bookkeeping. Pure module (no expo imports) so the sync
// transform and its tests can share the column lists.
import type { SyncTable } from '@/lib/config';

// Server-owned columns mirrored per table. The sync engine only ever writes these;
// local-only columns (e.g. documents.local_path) are preserved on upsert.
export const MIRROR_COLUMNS: Record<SyncTable, readonly string[]> = {
  trips: [
    'id',
    'organization_id',
    'name',
    'access_code',
    'status',
    'starts_at',
    'ends_at',
    'created_by',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  trip_members: [
    'id',
    'trip_id',
    'user_id',
    'role',
    'joined_at',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  travelers: [
    'id',
    'organization_id',
    'trip_id',
    'full_name',
    'birth_date',
    'sex',
    'document',
    'phone',
    'email',
    'notes',
    'submitted_via',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  guardians: [
    'id',
    'trip_id',
    'traveler_id',
    'full_name',
    'relationship',
    'document',
    'phone',
    'phone_secondary',
    'email',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  health_records: [
    'id',
    'trip_id',
    'traveler_id',
    'blood_type',
    'has_medical_conditions',
    'medical_conditions',
    'has_allergies',
    'allergies',
    'uses_continuous_medication',
    'medications',
    'needs_medication_on_trip',
    'has_dietary_restriction',
    'dietary_restrictions',
    'has_physical_limitation',
    'physical_limitation_description',
    'has_health_insurance',
    'health_insurance',
    'notes',
    'data',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  consents: [
    'id',
    'trip_id',
    'traveler_id',
    'kind',
    'accepted',
    'accepted_at',
    'terms_version',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  documents: [
    'id',
    'organization_id',
    'trip_id',
    'traveler_id',
    'kind',
    'storage_bucket',
    'storage_path',
    'file_name',
    'mime_type',
    'size_bytes',
    'uploaded_by',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
};

// Versioned local migrations, applied via PRAGMA user_version. Append-only: never
// edit an entry after it ships — add a new one (the mirror is reconstructible, so a
// destructive migration can simply drop + recreate and let sync repopulate).
export const LOCAL_MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE trips (
    id TEXT PRIMARY KEY NOT NULL,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    status TEXT NOT NULL,
    starts_at TEXT,
    ends_at TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE travelers (
    id TEXT PRIMARY KEY NOT NULL,
    organization_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    birth_date TEXT,
    sex TEXT,
    document TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    submitted_via TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX idx_travelers_trip ON travelers (trip_id);

  CREATE TABLE guardians (
    id TEXT PRIMARY KEY NOT NULL,
    trip_id TEXT NOT NULL,
    traveler_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    relationship TEXT,
    document TEXT,
    phone TEXT,
    phone_secondary TEXT,
    email TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX idx_guardians_traveler ON guardians (traveler_id);

  CREATE TABLE health_records (
    id TEXT PRIMARY KEY NOT NULL,
    trip_id TEXT NOT NULL,
    traveler_id TEXT NOT NULL,
    blood_type TEXT,
    has_medical_conditions INTEGER,
    medical_conditions TEXT,
    has_allergies INTEGER,
    allergies TEXT,
    uses_continuous_medication INTEGER,
    medications TEXT,
    needs_medication_on_trip INTEGER,
    has_dietary_restriction INTEGER,
    dietary_restrictions TEXT,
    has_physical_limitation INTEGER,
    physical_limitation_description TEXT,
    has_health_insurance INTEGER,
    health_insurance TEXT,
    notes TEXT,
    data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX idx_health_records_traveler ON health_records (traveler_id);

  CREATE TABLE consents (
    id TEXT PRIMARY KEY NOT NULL,
    trip_id TEXT NOT NULL,
    traveler_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    accepted INTEGER NOT NULL,
    accepted_at TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX idx_consents_traveler ON consents (traveler_id);

  CREATE TABLE documents (
    id TEXT PRIMARY KEY NOT NULL,
    organization_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    traveler_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    uploaded_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    -- Local-only cache state (never overwritten by sync):
    local_path TEXT,
    cached_at TEXT
  );
  CREATE INDEX idx_documents_traveler ON documents (traveler_id);

  CREATE TABLE sync_state (
    table_name TEXT PRIMARY KEY NOT NULL,
    cursor TEXT,
    last_synced_at TEXT
  );
  `,
  // Migration 2: trip_members mirror (per-trip role, for admin gating) + the local-only
  // pending_upload flag on documents (offline write-back outbox; survives sync upserts).
  `
  CREATE TABLE trip_members (
    id TEXT PRIMARY KEY NOT NULL,
    trip_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX idx_trip_members_trip ON trip_members (trip_id);

  ALTER TABLE documents ADD COLUMN pending_upload INTEGER NOT NULL DEFAULT 0;
  `,
];
