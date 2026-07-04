import imageCompression from 'browser-image-compression';
import type { DocumentInput, DocumentKind } from '@viagem/core';
import { getSupabaseBrowserClient } from './supabase-browser';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';
import { isPreview } from './preview';
import {
  ALLOWED_MIME_TYPES,
  IMAGE_COMPRESSION_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  REQUEST_UPLOAD_URL_ENDPOINT,
  SUPABASE_STORAGE_BUCKET,
} from './config';

export class UploadError extends Error {
  constructor(
    public readonly code:
      | 'invalid_type'
      | 'too_large'
      | 'sign_failed'
      | 'upload_failed'
      | 'compression_failed',
    message: string,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

// Human, Portuguese messages for the upload failure codes (safe to show; no sensitive data).
export function uploadErrorMessage(error: unknown): string {
  if (error instanceof UploadError) {
    switch (error.code) {
      case 'invalid_type':
        return 'Formato de arquivo não suportado.';
      case 'too_large':
        return 'Arquivo maior que o limite de 10 MB.';
      default:
        return 'Não foi possível enviar o arquivo. Tente novamente.';
    }
  }
  return 'Não foi possível enviar o arquivo. Tente novamente.';
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

// Validate against the kind's allowlist + size cap (UX-level; the Edge Function re-checks).
function validate(file: File, kind: DocumentKind): void {
  const allowed = ALLOWED_MIME_TYPES[kind];
  if (!allowed.includes(file.type)) {
    throw new UploadError('invalid_type', `mime ${file.type} not allowed for ${kind}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadError('too_large', 'file exceeds size cap');
  }
}

// Images are downscaled + re-encoded to WebP before leaving the device; PDFs pass through.
async function compress(file: File): Promise<File> {
  if (!isImage(file.type)) return file;
  try {
    return await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
  } catch {
    throw new UploadError('compression_failed', 'image compression failed');
  }
}

interface SignedUpload {
  bucket: string;
  path: string;
  token: string;
}

async function requestSignedUpload(params: {
  code: string;
  travelerId: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<SignedUpload> {
  const anonKey = getSupabaseAnonKey();
  const res = await fetch(`${getSupabaseUrl()}${REQUEST_UPLOAD_URL_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Functions gateway still expects the anon key even with verify_jwt disabled.
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      code: params.code,
      traveler_id: params.travelerId,
      kind: params.kind,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size_bytes: params.sizeBytes,
    }),
  });

  if (!res.ok) {
    throw new UploadError('sign_failed', `request-upload-url returned ${res.status}`);
  }
  const body = (await res.json()) as { bucket: string; path: string; token: string };
  return { bucket: body.bucket, path: body.path, token: body.token };
}

// Full pipeline for one file: validate → compress → request signed URL → upload → build the
// DocumentInput pointer the submit_traveler payload expects. Never logs file content.
export async function uploadTravelerFile(params: {
  file: File;
  kind: DocumentKind;
  code: string;
  travelerId: string;
}): Promise<DocumentInput> {
  const { file, kind, code, travelerId } = params;
  validate(file, kind);

  const processed = await compress(file);

  // Preview: validate + compress (so both are testable) but don't hit the network.
  if (isPreview()) {
    return {
      kind,
      storage_bucket: SUPABASE_STORAGE_BUCKET,
      storage_path: `preview/${kind}/${crypto.randomUUID()}-${processed.name || file.name}`,
      file_name: processed.name || file.name,
      mime_type: processed.type,
      size_bytes: processed.size,
    };
  }

  const signed = await requestSignedUpload({
    code,
    travelerId,
    kind,
    fileName: processed.name || file.name,
    mimeType: processed.type,
    sizeBytes: processed.size,
  });

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, processed);

  if (error) throw new UploadError('upload_failed', error.message);

  return {
    kind,
    storage_bucket: signed.bucket || SUPABASE_STORAGE_BUCKET,
    storage_path: signed.path,
    file_name: processed.name || file.name,
    mime_type: processed.type,
    size_bytes: processed.size,
  };
}
