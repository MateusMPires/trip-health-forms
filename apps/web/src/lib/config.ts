// Tunable parameters for the public traveler form. Per CLAUDE.md, every magic value/limit lives
// here — nothing hardcoded in the middle of the code.
import type { DocumentKind } from '@viagem/core';

// Version stamp recorded on every consent row. Bump when the LGPD / medical-care text changes,
// so we can tell which wording a guardian actually accepted.
export const TERMS_VERSION = '2026-07-01';

// Hard cap per uploaded file. Mirrored by the request-upload-url Edge Function (the trusted gate);
// the client check here is only for fast UX feedback.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Max number of continuous-use / treatment prescription PDFs a guardian can attach.
export const MAX_PRESCRIPTION_FILES = 5;

// Accepted MIME types per document kind. Keys are DocumentKind from @viagem/core.
export const ALLOWED_MIME_TYPES: Record<DocumentKind, readonly string[]> = {
  identity_document: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  authorization: ['application/pdf'],
  other: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

// Passed to browser-image-compression. Images are downscaled + re-encoded to WebP before upload.
export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2000,
  initialQuality: 0.8,
  useWebWorker: true,
  fileType: 'image/webp',
} as const;

// Private bucket the traveler files live in (see supabase/migrations/0011_storage.sql).
export const SUPABASE_STORAGE_BUCKET = 'traveler-files';

// Anonymous Edge Function that mints a scoped signed upload URL for the private bucket.
export const REQUEST_UPLOAD_URL_ENDPOINT = '/functions/v1/request-upload-url';

// Age (years) at/above which the traveler is not a minor. Mirrors MINOR_AGE_THRESHOLD in
// @viagem/core; re-exported through the core rule isMinor(), not re-implemented here.
