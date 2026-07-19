// Tunable parameters for the leaders app. Per CLAUDE.md, every magic value lives here —
// nothing hardcoded in the middle of the code. Domain constants come from @viagem/core.

// ── Local database (SQLCipher-encrypted mirror of Supabase) ─────────────────
export const LOCAL_DB_NAME = 'viagem-mirror.db';

// expo-secure-store keys (Keychain on iOS / Keystore on Android).
export const SECURE_STORE_DB_KEY = 'local_db_encryption_key';

// Bytes of entropy for the SQLCipher key (stored hex-encoded in the Keychain).
export const DB_KEY_BYTES = 32;

// ── Auth ─────────────────────────────────────────────────────────────────────
// Safety net for session restore: if the persisted session hasn't resolved by
// this deadline, fall back to the signed-out state instead of holding the splash
// forever (supabase-js getSession() can stall on React Native cold start).
export const SESSION_RESTORE_TIMEOUT_MS = 4000;

// Email OTP login. The code length must match Supabase's [auth.email] otp_length.
export const OTP_CODE_LENGTH = 6;

// How long the "resend code" action stays disabled after a code is requested.
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ── Sync (pull-based, server-wins) ───────────────────────────────────────────
// Tables mirrored locally, in dependency order (parents before children).
// trip_members carries the caller's per-trip role (RLS lets a member read their own
// row), used to gate the admin-only "add document" action offline.
export const SYNC_TABLES = [
  'trips',
  'trip_members',
  'travelers',
  'guardians',
  'health_records',
  'consents',
  'documents',
  'evangelism_reports',
] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

// Page size for each pull request against Supabase.
export const SYNC_PAGE_SIZE = 500;

// Abort the join_trip RPC if the network hangs longer than this (UI offers retry).
export const JOIN_TRIP_TIMEOUT_MS = 15_000;

// ── Documents (private bucket, cached in the app sandbox) ───────────────────
// Private bucket the traveler files live in (supabase/migrations/0011_storage.sql).
export const SUPABASE_STORAGE_BUCKET = 'traveler-files';

// TTL of the signed URLs minted to download document binaries.
export const SIGNED_URL_TTL_SECONDS = 300;

// Subdirectory of the app sandbox where document binaries are cached.
export const DOCUMENT_CACHE_DIR = 'traveler-documents';

// Skip prefetching binaries larger than this during sync (still downloadable on demand).
export const DOCUMENT_PREFETCH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Document upload (admin-only, offline-first write-back) ───────────────────
// Max size of a document an admin can attach from the app (mirrors the public form /
// request-upload-url gate).
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// MIME types accepted for app uploads (photos of signed paper documents).
export const UPLOADABLE_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

// Image-picker compression before upload (keeps binaries small for offline sync).
export const UPLOAD_IMAGE_QUALITY = 0.7;

// Document kinds an admin can add from the app, and who they apply to. Labels live in
// src/lib/format.ts; the "under 16" rule comes from @viagem/core.
export const UPLOADABLE_DOCUMENT_KINDS = ['commitment_term', 'national_travel_authorization'] as const;
