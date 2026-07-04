// request-upload-url — issues a short-lived signed upload URL for the anonymous public form.
//
// The public form cannot write to the private `traveler-files` bucket (anon has no Storage
// INSERT policy, see supabase/migrations/0011_storage.sql), and it must never learn a trip's
// organization_id / trip_id. This function runs with the service role: it resolves the trip
// from the access code server-side, builds the storage path itself (never trusting a client
// path), and returns a signed upload token scoped to exactly that one object.
//
// Deno runtime — this file is NOT part of the pnpm workspace and cannot import @viagem/core,
// so the small, DB-frozen allowlists below are duplicated with a pointer to the source of truth.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Mirror of DOCUMENT_KINDS in packages/core/src/constants/enums.ts (frozen by the DB
// `document_kind` enum). Kept inline because Deno can't resolve the workspace package.
const DOCUMENT_KINDS = ['identity_document', 'authorization', 'photo', 'other'] as const;
type DocumentKind = (typeof DOCUMENT_KINDS)[number];

// Trusted server-side gate. Mirrors apps/web/src/lib/config.ts (the client checks are UX only).
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES: Record<DocumentKind, readonly string[]> = {
  identity_document: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  authorization: ['application/pdf'],
  other: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const BUCKET = 'traveler-files';
const CODE_RE = /^\d{6}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Keep only a safe basename: drop any directory parts and characters that could escape the
// path or confuse Storage. The final object name is always prefixed by a server uuid, so a
// hostile file_name can at worst produce an ugly-but-contained name.
function safeBaseName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'file';
}

interface UploadRequest {
  code: string;
  traveler_id: string;
  kind: DocumentKind;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let payload: Partial<UploadRequest>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { code, traveler_id, kind, file_name, mime_type, size_bytes } = payload;

  // Validate every field before touching the database.
  if (typeof code !== 'string' || !CODE_RE.test(code)) return json({ error: 'invalid_code' }, 400);
  if (typeof traveler_id !== 'string' || !UUID_RE.test(traveler_id)) {
    return json({ error: 'invalid_traveler_id' }, 400);
  }
  if (typeof kind !== 'string' || !DOCUMENT_KINDS.includes(kind as DocumentKind)) {
    return json({ error: 'invalid_kind' }, 400);
  }
  if (typeof file_name !== 'string' || file_name.length === 0) {
    return json({ error: 'invalid_file_name' }, 400);
  }
  if (typeof mime_type !== 'string' || !ALLOWED_MIME_TYPES[kind as DocumentKind].includes(mime_type)) {
    return json({ error: 'invalid_mime_type' }, 400);
  }
  if (typeof size_bytes !== 'number' || !Number.isFinite(size_bytes) || size_bytes <= 0) {
    return json({ error: 'invalid_size' }, 400);
  }
  if (size_bytes > MAX_FILE_SIZE_BYTES) return json({ error: 'file_too_large' }, 413);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'server_misconfigured' }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve the trip server-side. This is where org_id / trip_id come from — never the client.
  const { data: trip, error: tripError } = await admin
    .from('trips')
    .select('id, organization_id')
    .eq('access_code', code)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  // Generic 404 for both "no such code" and "not active" — no enumeration signal.
  if (tripError || !trip) return json({ error: 'not_found' }, 404);

  // Build the path ourselves. Every segment is server-controlled (trip lookup + enum allowlist
  // + server uuid), so path traversal is structurally impossible even with a hostile file_name.
  const objectUuid = crypto.randomUUID();
  const path = `${trip.organization_id}/${trip.id}/${traveler_id}/${kind}/${objectUuid}-${safeBaseName(file_name)}`;

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (signError || !signed) return json({ error: 'sign_failed' }, 500);

  return json({
    bucket: BUCKET,
    path,
    token: signed.token,
    signed_url: signed.signedUrl,
  });
});
