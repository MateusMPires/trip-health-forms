import { describe, expect, it } from 'vitest';

import type { DocumentRow } from '@/db/types';
import { regularDocuments, selectDocumentSlots } from '@/features/documents/slots';

// Fixed local reference date so age math is timezone-independent (birth dates below are
// parsed as local `YYYY-MM-DDT00:00:00`, matching ageAt in @viagem/core).
const NOW = new Date(2026, 6, 19); // 2026-07-19

function makeDoc(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id: 'doc-1',
    organization_id: 'org-1',
    trip_id: 'trip-1',
    traveler_id: 'trav-1',
    kind: 'commitment_term',
    storage_bucket: 'traveler-files',
    storage_path: 'org/trip/trav/commitment_term/uuid-file.jpg',
    file_name: 'file.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 1000,
    uploaded_by: 'user-1',
    deleted_at: null,
    local_path: null,
    cached_at: null,
    pending_upload: 0,
    pending_delete: 0,
    ...overrides,
  };
}

describe('selectDocumentSlots', () => {
  it('always offers commitment_term and, for adults, nothing else', () => {
    const slots = selectDocumentSlots([], '2000-01-01', NOW); // age 26
    expect(slots.map((s) => s.kind)).toEqual(['commitment_term']);
    expect(slots[0].doc).toBeNull();
  });

  it('adds national_travel_authorization for travelers under 16', () => {
    const slots = selectDocumentSlots([], '2015-01-01', NOW); // age 11
    expect(slots.map((s) => s.kind)).toEqual(['commitment_term', 'national_travel_authorization']);
  });

  it('does not add national auth at exactly 16 (boundary)', () => {
    const slots = selectDocumentSlots([], '2010-07-19', NOW); // exactly 16
    expect(slots.map((s) => s.kind)).toEqual(['commitment_term']);
  });

  it('does not add national auth when the birth date is unknown', () => {
    const slots = selectDocumentSlots([], null, NOW);
    expect(slots.map((s) => s.kind)).toEqual(['commitment_term']);
  });

  it('fills each slot with the most recent (last, non-deleted) document of its kind', () => {
    const documents = [
      makeDoc({ id: 'c1', kind: 'commitment_term' }),
      makeDoc({ id: 'c2', kind: 'commitment_term' }),
      makeDoc({ id: 'n1', kind: 'national_travel_authorization' }),
    ];
    const slots = selectDocumentSlots(documents, '2015-01-01', NOW);
    expect(slots.find((s) => s.kind === 'commitment_term')?.doc?.id).toBe('c2');
    expect(slots.find((s) => s.kind === 'national_travel_authorization')?.doc?.id).toBe('n1');
  });

  it('ignores soft-deleted documents when filling a slot', () => {
    const documents = [makeDoc({ id: 'c1', kind: 'commitment_term', deleted_at: '2026-07-10T00:00:00Z' })];
    const slots = selectDocumentSlots(documents, '2000-01-01', NOW);
    expect(slots[0].doc).toBeNull();
  });
});

describe('regularDocuments', () => {
  it('keeps non-slot kinds and drops the two admin-managed kinds', () => {
    const documents = [
      makeDoc({ id: 'id-1', kind: 'identity_document' }),
      makeDoc({ id: 'ph-1', kind: 'photo' }),
      makeDoc({ id: 'c1', kind: 'commitment_term' }),
      makeDoc({ id: 'n1', kind: 'national_travel_authorization' }),
    ];
    expect(regularDocuments(documents).map((d) => d.id)).toEqual(['id-1', 'ph-1']);
  });

  it('drops soft-deleted documents', () => {
    const documents = [
      makeDoc({ id: 'id-1', kind: 'identity_document' }),
      makeDoc({ id: 'id-2', kind: 'identity_document', deleted_at: '2026-07-10T00:00:00Z' }),
    ];
    expect(regularDocuments(documents).map((d) => d.id)).toEqual(['id-1']);
  });
});
