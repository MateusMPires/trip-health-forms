// Offline-first document upload (admin only). Adding a document is 100% local: the
// picked photo is copied into the sandbox cache and a `pending_upload` row is written,
// so it shows instantly and works offline. The sync engine later pushes the binary +
// row to Supabase (see pushPendingDocuments), and the next pull reconciles by id.
//
// This is the app's only write-back path; everything else stays read-only / server-wins.
// Never log binaries, storage paths or file names (may reference minors — CLAUDE.md).
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

import {
  clearPendingDelete,
  clearPendingUpload,
  deleteLocalDocument,
  insertLocalDocument,
  listPendingDeletes,
  listPendingUploads,
  markLocalDocumentDeleted,
  setDocumentCache,
} from '@/db/daos';
import type { DocumentRow, TravelerRow } from '@/db/types';
import {
  MAX_UPLOAD_SIZE_BYTES,
  SUPABASE_STORAGE_BUCKET,
  UPLOADABLE_DOCUMENT_MIME_TYPES,
} from '@/lib/config';
import { supabase } from '@/lib/supabase';

import { cacheDirUri, ensureCacheDir } from './cache';

export type UploadableKind = 'commitment_term' | 'national_travel_authorization';

/** Minimal shape of the asset returned by expo-image-picker that we care about. */
export type PickedAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

/** Safe basename for the storage path — drop directory parts and odd characters. */
function safeBaseName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'file';
}

function extensionFor(mimeType: string, fileName: string | null | undefined): string {
  const fromName = fileName?.match(/\.[A-Za-z0-9]+$/)?.[0];
  return fromName?.toLowerCase() ?? MIME_EXTENSIONS[mimeType] ?? '';
}

/** Minimal, dependency-free base64 → ArrayBuffer decoder for the Storage upload body. */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i += 1) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/=+$/, '');
  const byteLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    if (p < byteLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLength) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes.buffer;
}

/**
 * Adds a document to a traveler entirely offline: validates, copies the binary into the
 * cache, and inserts a `pending_upload` row. No network. Returns the new document id.
 */
export async function addTravelerDocument(params: {
  traveler: TravelerRow;
  kind: UploadableKind;
  asset: PickedAsset;
  userId: string;
}): Promise<string> {
  const { traveler, kind, asset, userId } = params;

  const mimeType = asset.mimeType ?? 'image/jpeg';
  if (!(UPLOADABLE_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error('unsupported_mime_type');
  }
  if (asset.fileSize != null && asset.fileSize > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('file_too_large');
  }

  const id = Crypto.randomUUID();
  const ext = extensionFor(mimeType, asset.fileName);
  const baseName = safeBaseName(asset.fileName ?? `${kind}${ext}`);

  // Server-controlled path convention; the same id is reused for the remote row so the
  // next pull reconciles without duplicating (0011_storage.sql / submit_traveler pattern).
  const objectUuid = Crypto.randomUUID();
  const storagePath =
    `${traveler.organization_id}/${traveler.trip_id}/${traveler.id}/${kind}/${objectUuid}-${baseName}`;

  // Copy the picked file into the cache dir under the document id so it renders offline.
  await ensureCacheDir();
  const localPath = `${cacheDirUri()}${id}${ext}`;
  await FileSystem.copyAsync({ from: asset.uri, to: localPath });

  const info = await FileSystem.getInfoAsync(localPath);
  const sizeBytes = info.exists && !info.isDirectory ? (info.size ?? asset.fileSize ?? null) : null;

  await insertLocalDocument({
    id,
    organization_id: traveler.organization_id,
    trip_id: traveler.trip_id,
    traveler_id: traveler.id,
    kind,
    storage_bucket: SUPABASE_STORAGE_BUCKET,
    storage_path: storagePath,
    file_name: baseName,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    uploaded_by: userId,
    local_path: localPath,
    created_at: new Date().toISOString(),
  });

  return id;
}

/**
 * Pushes one pending document to the server: uploads the binary (idempotent via upsert)
 * then inserts the row (id explicit; a duplicate-key means it was already pushed). On
 * success clears the pending flag and keeps the cached binary. Errors bubble up so the
 * caller can keep the row pending and retry on the next sync.
 */
async function pushDocument(doc: DocumentRow): Promise<void> {
  if (!doc.local_path) {
    // No local binary to push (shouldn't happen for a pending row) — drop the flag.
    await clearPendingUpload(doc.id);
    return;
  }

  const base64 = await FileSystem.readAsStringAsync(doc.local_path, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const body = base64ToArrayBuffer(base64);

  const { error: uploadError } = await supabase.storage
    .from(doc.storage_bucket)
    .upload(doc.storage_path, body, {
      contentType: doc.mime_type ?? 'application/octet-stream',
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('documents').insert({
    id: doc.id,
    organization_id: doc.organization_id,
    trip_id: doc.trip_id,
    traveler_id: doc.traveler_id,
    kind: doc.kind,
    storage_bucket: doc.storage_bucket,
    storage_path: doc.storage_path,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    uploaded_by: doc.uploaded_by,
  });
  // 23505 = unique_violation: the row already exists (a prior partial push). Idempotent.
  if (insertError && insertError.code !== '23505') throw insertError;

  await clearPendingUpload(doc.id);
  await setDocumentCache(doc.id, doc.local_path, new Date().toISOString());
}

/**
 * Drains the offline outbox — uploads every pending document. Best-effort: a failure on
 * one document (offline / transient) leaves it pending for the next sync and does not
 * block the others. Called at the start of runSync, before the pull reconciles.
 */
export async function pushPendingDocuments(): Promise<void> {
  const pending = await listPendingUploads();
  for (const doc of pending) {
    try {
      await pushDocument(doc);
    } catch {
      // Keep pending_upload = 1 and retry on the next sync. No details logged (sensitive).
    }
  }
}

/**
 * Deletes a document offline-first. If it never reached the server (still pending its first
 * upload), just drops the cached binary and the local row — there is nothing to push.
 * Otherwise it is soft-deleted locally (`deleted_at` + `pending_delete = 1`) and the sync
 * push removes it on the server. It disappears from the UI at once either way.
 */
export async function deleteTravelerDocument(doc: DocumentRow): Promise<void> {
  if (doc.pending_upload) {
    if (doc.local_path) {
      await FileSystem.deleteAsync(doc.local_path, { idempotent: true });
    }
    await deleteLocalDocument(doc.id);
    return;
  }
  await markLocalDocumentDeleted(doc.id, new Date().toISOString());
}

/**
 * Replaces a document: adds the new binary (offline) then soft-deletes the old one (offline).
 * Adding first means a validation failure never deletes the old document. One document per
 * kind, so the slot shows the new binary immediately (the old is soft-deleted and filtered
 * out of `listDocuments`). Returns the new document id.
 */
export async function replaceTravelerDocument(params: {
  traveler: TravelerRow;
  kind: UploadableKind;
  oldDoc: DocumentRow;
  asset: PickedAsset;
  userId: string;
}): Promise<string> {
  const { traveler, kind, oldDoc, asset, userId } = params;
  const id = await addTravelerDocument({ traveler, kind, asset, userId });
  await deleteTravelerDocument(oldDoc);
  return id;
}

/**
 * Pushes one soft-delete to the server: sets `deleted_at` on the row (the trigger bumps
 * `updated_at`, so the deletion propagates to other devices on their next pull) and removes
 * the binary from Storage (LGPD — the file is sensitive). Both are idempotent; a missing
 * object is not treated as an error. On success clears the pending flag and drops the local
 * cached binary. Errors bubble up so the row stays pending and retries on the next sync.
 */
async function pushDocumentDeletion(doc: DocumentRow): Promise<void> {
  const deletedAt = doc.deleted_at ?? new Date().toISOString();

  const { error: updateError } = await supabase
    .from('documents')
    .update({ deleted_at: deletedAt })
    .eq('id', doc.id);
  if (updateError) throw updateError;

  const { error: removeError } = await supabase.storage
    .from(doc.storage_bucket)
    .remove([doc.storage_path]);
  if (removeError) throw removeError;

  await clearPendingDelete(doc.id);
  if (doc.local_path) {
    await FileSystem.deleteAsync(doc.local_path, { idempotent: true });
  }
  await setDocumentCache(doc.id, null, null);
}

/**
 * Drains the delete outbox — soft-deletes every pending document on the server and removes
 * its binary. Best-effort: a failure on one (offline / transient) leaves it pending for the
 * next sync and does not block the others. Called at the start of runSync, before the pull.
 */
export async function pushPendingDeletions(): Promise<void> {
  const pending = await listPendingDeletes();
  for (const doc of pending) {
    try {
      await pushDocumentDeletion(doc);
    } catch {
      // Keep pending_delete = 1 and retry on the next sync. No details logged (sensitive).
    }
  }
}
