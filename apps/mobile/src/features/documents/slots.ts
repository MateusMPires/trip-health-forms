// Pure selection logic for the traveler-detail document rows (no React Native / Expo
// imports so it is unit-testable). Splits the mirror rows into the "regular" documents
// (rendered as plain rows) and the two admin-managed slots — Termo de Compromisso
// (everyone) and Autorização de Viagem Nacional (travelers under 16) — each carrying the
// most recent non-deleted document of its kind, or null when nothing has been added yet.
import { requiresNationalTravelAuthorization } from '@viagem/core';

import type { DocumentRow } from '@/db/types';
import { UPLOADABLE_DOCUMENT_KINDS } from '@/lib/config';

// Type-only import (erased at build) so this stays free of upload.ts's Expo dependencies.
import type { UploadableKind } from './upload';

export type DocumentSlot = { kind: UploadableKind; doc: DocumentRow | null };

const UPLOADABLE_KIND_SET: ReadonlySet<string> = new Set(UPLOADABLE_DOCUMENT_KINDS);

/** Documents that are not one of the two admin-managed slot kinds (shown as plain rows). */
export function regularDocuments(documents: readonly DocumentRow[]): DocumentRow[] {
  return documents.filter((doc) => !UPLOADABLE_KIND_SET.has(doc.kind) && !doc.deleted_at);
}

// The most recent non-deleted document of a kind. Relies on the input being in ascending
// created_at order (as `listDocuments` returns it), keeping the last match seen.
function latestOfKind(documents: readonly DocumentRow[], kind: UploadableKind): DocumentRow | null {
  let latest: DocumentRow | null = null;
  for (const doc of documents) {
    if (doc.kind === kind && !doc.deleted_at) latest = doc;
  }
  return latest;
}

/**
 * The admin-managed slots for a traveler: `commitment_term` for everyone, plus
 * `national_travel_authorization` when the traveler is under the national-auth age
 * (`requiresNationalTravelAuthorization`, from @viagem/core). Each slot carries the most
 * recent non-deleted document of its kind, or null when nothing has been added yet.
 */
export function selectDocumentSlots(
  documents: readonly DocumentRow[],
  birthDate: string | null,
  now: Date,
): DocumentSlot[] {
  const kinds: UploadableKind[] = ['commitment_term'];
  if (requiresNationalTravelAuthorization(birthDate, now)) {
    kinds.push('national_travel_authorization');
  }
  return kinds.map((kind) => ({ kind, doc: latestOfKind(documents, kind) }));
}
