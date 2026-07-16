// Offline cache for document binaries (private bucket → app sandbox). Pointers and
// cache state live in the documents mirror table; the files themselves live under
// the app's document directory, inside the app sandbox.
import * as FileSystem from 'expo-file-system/legacy';

import { listDocumentsToCache, setDocumentCache } from '@/db/daos';
import type { DocumentRow } from '@/db/types';
import {
  DOCUMENT_CACHE_DIR,
  DOCUMENT_PREFETCH_MAX_BYTES,
  SIGNED_URL_TTL_SECONDS,
} from '@/lib/config';
import { supabase } from '@/lib/supabase';

/** Absolute URI of the document cache directory inside the app sandbox. */
export function cacheDirUri(): string {
  return `${FileSystem.documentDirectory}${DOCUMENT_CACHE_DIR}/`;
}

/** Creates the document cache directory if it doesn't exist yet. */
export async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(cacheDirUri());
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(cacheDirUri(), { intermediates: true });
  }
}

function fileExtension(doc: DocumentRow): string {
  const fromName = doc.file_name?.match(/\.[A-Za-z0-9]+$/)?.[0];
  if (fromName) return fromName.toLowerCase();
  if (doc.mime_type === 'application/pdf') return '.pdf';
  if (doc.mime_type?.startsWith('image/')) return `.${doc.mime_type.slice(6)}`;
  return '';
}

/** Whether a document renders as an image (previewable inline via <Image>). */
export function isImageDocument(doc: DocumentRow): boolean {
  if (doc.mime_type?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(doc.file_name ?? '');
}

/** Downloads a document binary via signed URL and records the cache pointer. */
export async function downloadDocument(doc: DocumentRow): Promise<string> {
  const { data, error } = await supabase.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(`signed url failed for document ${doc.id}`);
  }

  await ensureCacheDir();
  const target = `${cacheDirUri()}${doc.id}${fileExtension(doc)}`;
  const result = await FileSystem.downloadAsync(data.signedUrl, target);
  if (result.status !== 200) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error(`download failed for document ${doc.id} (${result.status})`);
  }

  await setDocumentCache(doc.id, result.uri, new Date().toISOString());
  return result.uri;
}

/**
 * Local URI for a document, downloading (and caching) it when needed. Throws when
 * offline and not cached — callers surface that as "disponível apenas online".
 */
export async function getLocalDocumentUri(doc: DocumentRow): Promise<string> {
  if (doc.local_path) {
    const info = await FileSystem.getInfoAsync(doc.local_path);
    if (info.exists) return doc.local_path;
    // Stale pointer (e.g. OS cleared storage): fall through and re-download.
  }
  return downloadDocument(doc);
}

/** Best-effort prefetch of every uncached binary; failures retry on the next sync. */
export async function prefetchDocumentBinaries(): Promise<void> {
  const pending = await listDocumentsToCache(DOCUMENT_PREFETCH_MAX_BYTES);
  for (const doc of pending) {
    try {
      await downloadDocument(doc);
    } catch {
      // Offline or transient storage error — the next sync retries.
    }
  }
}

/** Wipes the binary cache (used on sign-out, together with the mirror reset). */
export async function clearDocumentCache(): Promise<void> {
  await FileSystem.deleteAsync(cacheDirUri(), { idempotent: true });
}
