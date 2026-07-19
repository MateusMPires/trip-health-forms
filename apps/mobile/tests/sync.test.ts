import { describe, expect, it } from 'vitest';

import { nextCursor, serializeRowForMirror } from '@/features/sync/transform';

describe('serializeRowForMirror', () => {
  it('keeps only mirrored columns and coerces values for SQLite', () => {
    const row = {
      id: 'hr-1',
      trip_id: 'trip-1',
      traveler_id: 'trav-1',
      blood_type: 'O+',
      has_allergies: true,
      has_medical_conditions: false,
      data: { medical_conditions: ['asthma'] },
      created_at: '2026-07-01T10:00:00+00:00',
      updated_at: '2026-07-02T10:00:00+00:00',
      deleted_at: null,
      // Not part of the mirror: must be dropped.
      unexpected_column: 'nope',
    };

    const serialized = serializeRowForMirror('health_records', row);

    expect(serialized.id).toBe('hr-1');
    expect(serialized.has_allergies).toBe(1);
    expect(serialized.has_medical_conditions).toBe(0);
    expect(serialized.data).toBe('{"medical_conditions":["asthma"]}');
    expect(serialized.deleted_at).toBeNull();
    expect('unexpected_column' in serialized).toBe(false);
  });

  it('fills missing mirrored columns with null', () => {
    const serialized = serializeRowForMirror('travelers', {
      id: 't-1',
      full_name: 'Ana',
      updated_at: '2026-07-02T10:00:00+00:00',
    });
    expect(serialized.birth_date).toBeNull();
    expect(serialized.phone).toBeNull();
  });

  it('mirrors soft-deleted rows so deletions propagate offline', () => {
    const serialized = serializeRowForMirror('travelers', {
      id: 't-1',
      full_name: 'Ana',
      deleted_at: '2026-07-03T08:00:00+00:00',
      updated_at: '2026-07-03T08:00:00+00:00',
    });
    expect(serialized.deleted_at).toBe('2026-07-03T08:00:00+00:00');
  });

  it('keeps evangelism counters and drops the local-only pending_sync flag', () => {
    const serialized = serializeRowForMirror('evangelism_reports', {
      id: 'er-1',
      organization_id: 'org-1',
      trip_id: 'trip-1',
      author_id: 'user-1',
      report_date: '2026-07-15',
      approaches: 12,
      gospel_presentations: 8,
      professions_of_faith: 3,
      reconciliations: 1,
      referrals: 2,
      prayer_requests: 5,
      notes: null,
      created_at: '2026-07-15T20:00:00+00:00',
      updated_at: '2026-07-15T20:00:00+00:00',
      deleted_at: null,
      // Local-only outbox flag: must never be mirrored back from the server.
      pending_sync: 1,
    });
    expect(serialized.professions_of_faith).toBe(3);
    expect(serialized.report_date).toBe('2026-07-15');
    expect('pending_sync' in serialized).toBe(false);
  });

  it('keeps document server columns and drops the local-only outbox/cache columns', () => {
    const serialized = serializeRowForMirror('documents', {
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
      created_at: '2026-07-15T20:00:00+00:00',
      updated_at: '2026-07-15T20:00:00+00:00',
      deleted_at: null,
      // Local-only outbox/cache columns: must never be mirrored back from the server.
      local_path: '/cache/doc-1.jpg',
      cached_at: '2026-07-15T20:00:00+00:00',
      pending_upload: 1,
      pending_delete: 1,
    });
    expect(serialized.kind).toBe('commitment_term');
    expect(serialized.storage_path).toBe('org/trip/trav/commitment_term/uuid-file.jpg');
    expect('pending_upload' in serialized).toBe(false);
    expect('pending_delete' in serialized).toBe(false);
    expect('local_path' in serialized).toBe(false);
    expect('cached_at' in serialized).toBe(false);
  });

  it('mirrors the trip_members role (used for offline admin gating)', () => {
    const serialized = serializeRowForMirror('trip_members', {
      id: 'tm-1',
      trip_id: 'trip-1',
      user_id: 'user-1',
      role: 'administrator',
      joined_at: '2026-07-01T10:00:00+00:00',
      created_at: '2026-07-01T10:00:00+00:00',
      updated_at: '2026-07-01T10:00:00+00:00',
      deleted_at: null,
      // Not mirrored: dropped.
      secret: 'nope',
    });
    expect(serialized.role).toBe('administrator');
    expect(serialized.user_id).toBe('user-1');
    expect('secret' in serialized).toBe(false);
  });
});

describe('nextCursor', () => {
  it('returns the current cursor when no rows were pulled', () => {
    expect(nextCursor('2026-07-01T00:00:00+00:00', [])).toBe('2026-07-01T00:00:00+00:00');
    expect(nextCursor(null, [])).toBeNull();
  });

  it('advances to the greatest updated_at seen', () => {
    const rows = [
      { updated_at: '2026-07-01T10:00:00+00:00' },
      { updated_at: '2026-07-03T10:00:00+00:00' },
      { updated_at: '2026-07-02T10:00:00+00:00' },
    ];
    expect(nextCursor(null, rows)).toBe('2026-07-03T10:00:00+00:00');
  });

  it('never moves backwards (server-wins, forward-only)', () => {
    const rows = [{ updated_at: '2026-06-01T10:00:00+00:00' }];
    expect(nextCursor('2026-07-01T00:00:00+00:00', rows)).toBe('2026-07-01T00:00:00+00:00');
  });

  it('ignores rows with missing or malformed updated_at', () => {
    const rows = [{ updated_at: undefined }, {}, { updated_at: 42 }];
    expect(nextCursor('2026-07-01T00:00:00+00:00', rows)).toBe('2026-07-01T00:00:00+00:00');
  });
});
