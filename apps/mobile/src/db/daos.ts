// All local SQL lives here — features never write SQL themselves (CLAUDE.md).
// Reads filter soft-deleted rows; the sync engine still mirrors them so
// deletions propagate offline.
import type { MemberRole } from '@viagem/core';
import type { SQLiteBindValue } from 'expo-sqlite';

import type { SyncTable } from '@/lib/config';

import { getDb } from './client';
import { MIRROR_COLUMNS } from './schema';
import type {
  ConsentRow,
  DocumentRow,
  EvangelismReportRow,
  GuardianRow,
  HealthRecordRow,
  TravelerRow,
  TripRow,
} from './types';

export type MirrorRow = Record<string, SQLiteBindValue>;

/**
 * Server-wins upsert of already-serialized rows into a mirror table. Only the
 * mirrored (server-owned) columns are touched, so local-only columns such as
 * documents.local_path survive re-syncs.
 */
export async function upsertMirrorRows(table: SyncTable, rows: MirrorRow[]): Promise<void> {
  if (rows.length === 0) return;

  const columns = MIRROR_COLUMNS[table];
  const placeholders = columns.map(() => '?').join(', ');
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET ${updates}`;

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const statement = await db.prepareAsync(sql);
    try {
      for (const row of rows) {
        await statement.executeAsync(columns.map((column) => row[column] ?? null));
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
}

// ── Sync bookkeeping ─────────────────────────────────────────────────────────

export async function getSyncCursor(table: SyncTable): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cursor: string | null }>(
    'SELECT cursor FROM sync_state WHERE table_name = ?',
    [table],
  );
  return row?.cursor ?? null;
}

export async function setSyncCursor(
  table: SyncTable,
  cursor: string | null,
  syncedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_state (table_name, cursor, last_synced_at) VALUES (?, ?, ?)
     ON CONFLICT (table_name) DO UPDATE SET cursor = excluded.cursor,
       last_synced_at = excluded.last_synced_at`,
    [table, cursor, syncedAt],
  );
}

/**
 * Clears every incremental cursor so the next sync re-pulls all tables in full.
 * Needed after join_trip: the newly visible trip's rows usually predate the
 * cursors, so an incremental pull would skip them forever. The mirror upsert is
 * idempotent, so a full re-pull is always safe.
 */
export async function clearSyncCursors(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sync_state SET cursor = NULL');
}

export async function getLastSyncedAt(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ last: string | null }>(
    'SELECT MAX(last_synced_at) AS last FROM sync_state',
  );
  return row?.last ?? null;
}

// ── Trips ────────────────────────────────────────────────────────────────────

export type TripListItem = TripRow & { traveler_count: number };

export async function listTrips(): Promise<TripListItem[]> {
  const db = await getDb();
  return db.getAllAsync<TripListItem>(
    `SELECT t.*, (
       SELECT COUNT(*) FROM travelers v
       WHERE v.trip_id = t.id AND v.deleted_at IS NULL
     ) AS traveler_count
     FROM trips t
     WHERE t.deleted_at IS NULL
     ORDER BY t.starts_at IS NULL, t.starts_at DESC, t.name COLLATE NOCASE`,
  );
}

export async function getTrip(id: string): Promise<TripRow | null> {
  const db = await getDb();
  return db.getFirstAsync<TripRow>(
    'SELECT * FROM trips WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
}

// ── Trip members (role) ──────────────────────────────────────────────────────

/**
 * The current user's role on the trip, read from the local mirror (works offline).
 * RLS lets a member read their own trip_members row. Null when not a member.
 */
export async function getTripMemberRole(
  tripId: string,
  userId: string,
): Promise<MemberRole | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ role: MemberRole }>(
    `SELECT role FROM trip_members
     WHERE trip_id = ? AND user_id = ? AND deleted_at IS NULL`,
    [tripId, userId],
  );
  return row?.role ?? null;
}

/**
 * Whether the current user is an administrator of the trip, read from the local
 * mirror (works offline). RLS lets a member read their own trip_members row.
 */
export async function isCurrentUserTripAdmin(tripId: string, userId: string): Promise<boolean> {
  return (await getTripMemberRole(tripId, userId)) === 'administrator';
}

// ── Travelers ────────────────────────────────────────────────────────────────

export type TravelerListItem = TravelerRow & {
  /** Comma-joined consent kinds explicitly denied by the traveler (GROUP_CONCAT). */
  denied_consent_kinds: string | null;
  has_allergies: number | null;
  has_dietary_restriction: number | null;
};

export async function listTravelers(tripId: string): Promise<TravelerListItem[]> {
  const db = await getDb();
  return db.getAllAsync<TravelerListItem>(
    `SELECT v.*,
       (SELECT GROUP_CONCAT(c.kind) FROM consents c
        WHERE c.traveler_id = v.id AND c.deleted_at IS NULL AND c.accepted = 0
       ) AS denied_consent_kinds,
       (SELECT h.has_allergies FROM health_records h
        WHERE h.traveler_id = v.id AND h.deleted_at IS NULL
        ORDER BY h.updated_at DESC LIMIT 1
       ) AS has_allergies,
       (SELECT h.has_dietary_restriction FROM health_records h
        WHERE h.traveler_id = v.id AND h.deleted_at IS NULL
        ORDER BY h.updated_at DESC LIMIT 1
       ) AS has_dietary_restriction
     FROM travelers v
     WHERE v.trip_id = ? AND v.deleted_at IS NULL
     ORDER BY v.full_name COLLATE NOCASE`,
    [tripId],
  );
}

export async function countTravelers(tripId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM travelers WHERE trip_id = ? AND deleted_at IS NULL',
    [tripId],
  );
  return row?.count ?? 0;
}

export async function getTraveler(id: string): Promise<TravelerRow | null> {
  const db = await getDb();
  return db.getFirstAsync<TravelerRow>(
    'SELECT * FROM travelers WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
}

// ── Traveler detail satellites ───────────────────────────────────────────────

export async function listGuardians(travelerId: string): Promise<GuardianRow[]> {
  const db = await getDb();
  return db.getAllAsync<GuardianRow>(
    `SELECT * FROM guardians
     WHERE traveler_id = ? AND deleted_at IS NULL
     ORDER BY full_name COLLATE NOCASE`,
    [travelerId],
  );
}

export async function getHealthRecord(travelerId: string): Promise<HealthRecordRow | null> {
  const db = await getDb();
  return db.getFirstAsync<HealthRecordRow>(
    `SELECT * FROM health_records
     WHERE traveler_id = ? AND deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 1`,
    [travelerId],
  );
}

export async function listConsents(travelerId: string): Promise<ConsentRow[]> {
  const db = await getDb();
  return db.getAllAsync<ConsentRow>(
    `SELECT * FROM consents
     WHERE traveler_id = ? AND deleted_at IS NULL
     ORDER BY accepted_at`,
    [travelerId],
  );
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function listDocuments(travelerId: string): Promise<DocumentRow[]> {
  const db = await getDb();
  return db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents
     WHERE traveler_id = ? AND deleted_at IS NULL
     ORDER BY created_at`,
    [travelerId],
  );
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const db = await getDb();
  return db.getFirstAsync<DocumentRow>(
    'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
}

/** Documents whose binaries still need prefetching into the offline cache. */
export async function listDocumentsToCache(maxBytes: number): Promise<DocumentRow[]> {
  const db = await getDb();
  return db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents
     WHERE deleted_at IS NULL
       AND local_path IS NULL
       AND (size_bytes IS NULL OR size_bytes <= ?)`,
    [maxBytes],
  );
}

export async function setDocumentCache(
  id: string,
  localPath: string | null,
  cachedAt: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE documents SET local_path = ?, cached_at = ? WHERE id = ?', [
    localPath,
    cachedAt,
    id,
  ]);
}

// ── Document upload outbox (admin-only, offline-first write-back) ────────────

/** A locally-added document awaiting its first push to the server. */
export type LocalDocumentInsert = {
  id: string;
  organization_id: string;
  trip_id: string;
  traveler_id: string;
  kind: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  local_path: string;
  created_at: string;
};

/**
 * Inserts a document added offline: the binary already lives in the cache dir
 * (`local_path`), and `pending_upload = 1` marks it for the sync push. It renders
 * immediately and reconciles against the server row (same id) on the next pull.
 */
export async function insertLocalDocument(doc: LocalDocumentInsert): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO documents (
       id, organization_id, trip_id, traveler_id, kind, storage_bucket, storage_path,
       file_name, mime_type, size_bytes, uploaded_by, created_at, updated_at,
       local_path, cached_at, pending_upload
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      doc.id,
      doc.organization_id,
      doc.trip_id,
      doc.traveler_id,
      doc.kind,
      doc.storage_bucket,
      doc.storage_path,
      doc.file_name,
      doc.mime_type,
      doc.size_bytes,
      doc.uploaded_by,
      doc.created_at,
      doc.created_at,
      doc.local_path,
      doc.created_at,
    ],
  );
}

/** Documents added offline that still need pushing to the server. */
export async function listPendingUploads(): Promise<DocumentRow[]> {
  const db = await getDb();
  return db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents
     WHERE pending_upload = 1 AND deleted_at IS NULL
     ORDER BY created_at`,
  );
}

/** Clears the pending flag once the document has been pushed to the server. */
export async function clearPendingUpload(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE documents SET pending_upload = 0 WHERE id = ?', [id]);
}

// ── Document delete outbox (admin-only, offline-first soft-delete) ────────────

/**
 * Soft-deletes a document locally and marks it for the sync push: it disappears from
 * `listDocuments`/`listPendingUploads` at once (both filter `deleted_at IS NULL`) and the
 * push (`pushPendingDeletions`) sets `deleted_at` on the server + removes the binary.
 */
export async function markLocalDocumentDeleted(id: string, deletedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE documents SET deleted_at = ?, updated_at = ?, pending_delete = 1 WHERE id = ?',
    [deletedAt, deletedAt, id],
  );
}

/** Documents soft-deleted offline that still need pushing to the server. */
export async function listPendingDeletes(): Promise<DocumentRow[]> {
  const db = await getDb();
  return db.getAllAsync<DocumentRow>('SELECT * FROM documents WHERE pending_delete = 1');
}

/** Clears the pending-delete flag once the server soft-delete + Storage removal succeeded. */
export async function clearPendingDelete(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE documents SET pending_delete = 0 WHERE id = ?', [id]);
}

/** Hard-removes a local document row — used when deleting one that never reached the server. */
export async function deleteLocalDocument(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
}

// ── Evangelism reports (group-leader, offline-first write-back) ───────────────

/** Consolidated daily totals across every group leader on the trip. */
export type EvangelismDaySummary = {
  report_date: string;
  approaches: number;
  gospel_presentations: number;
  professions_of_faith: number;
  reconciliations: number;
  referrals: number;
  prayer_requests: number;
  /** How many leaders filed a report for this day. */
  leader_count: number;
};

export async function sumEvangelismByDate(tripId: string): Promise<EvangelismDaySummary[]> {
  const db = await getDb();
  return db.getAllAsync<EvangelismDaySummary>(
    `SELECT report_date,
       SUM(approaches) AS approaches,
       SUM(gospel_presentations) AS gospel_presentations,
       SUM(professions_of_faith) AS professions_of_faith,
       SUM(reconciliations) AS reconciliations,
       SUM(referrals) AS referrals,
       SUM(prayer_requests) AS prayer_requests,
       COUNT(DISTINCT author_id) AS leader_count
     FROM evangelism_reports
     WHERE trip_id = ? AND deleted_at IS NULL
     GROUP BY report_date
     ORDER BY report_date DESC`,
    [tripId],
  );
}

/** The current user's own reports on the trip (one row per day they filed). */
export async function listMyEvangelismReports(
  tripId: string,
  authorId: string,
): Promise<EvangelismReportRow[]> {
  const db = await getDb();
  return db.getAllAsync<EvangelismReportRow>(
    `SELECT * FROM evangelism_reports
     WHERE trip_id = ? AND author_id = ? AND deleted_at IS NULL
     ORDER BY report_date DESC`,
    [tripId, authorId],
  );
}

/**
 * The current user's report for a specific day, if any — used to prefill the form
 * and reuse its id so re-filing a day is an update, not a duplicate.
 */
export async function getMyEvangelismReport(
  tripId: string,
  authorId: string,
  reportDate: string,
): Promise<EvangelismReportRow | null> {
  const db = await getDb();
  return db.getFirstAsync<EvangelismReportRow>(
    `SELECT * FROM evangelism_reports
     WHERE trip_id = ? AND author_id = ? AND report_date = ? AND deleted_at IS NULL`,
    [tripId, authorId, reportDate],
  );
}

/** A locally-filed/edited report awaiting its push to the server. */
export type LocalReportUpsert = {
  id: string;
  organization_id: string;
  trip_id: string;
  author_id: string;
  report_date: string;
  approaches: number;
  gospel_presentations: number;
  professions_of_faith: number;
  reconciliations: number;
  referrals: number;
  prayer_requests: number;
  notes: string | null;
  /** ISO timestamp used for both created_at (new rows) and updated_at. */
  timestamp: string;
};

/**
 * Inserts or updates a report filed offline: `pending_sync = 1` marks it for the
 * sync push. The caller resolves `id` (a reused server/local id when editing a day,
 * a fresh uuid for a new day), so the ON CONFLICT(id) upsert edits in place. The
 * row reconciles against the server row (same id) on the next pull.
 */
export async function upsertLocalReport(report: LocalReportUpsert): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO evangelism_reports (
       id, organization_id, trip_id, author_id, report_date,
       approaches, gospel_presentations, professions_of_faith, reconciliations,
       referrals, prayer_requests, notes, created_at, updated_at, deleted_at, pending_sync
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1)
     ON CONFLICT (id) DO UPDATE SET
       report_date = excluded.report_date,
       approaches = excluded.approaches,
       gospel_presentations = excluded.gospel_presentations,
       professions_of_faith = excluded.professions_of_faith,
       reconciliations = excluded.reconciliations,
       referrals = excluded.referrals,
       prayer_requests = excluded.prayer_requests,
       notes = excluded.notes,
       updated_at = excluded.updated_at,
       deleted_at = NULL,
       pending_sync = 1`,
    [
      report.id,
      report.organization_id,
      report.trip_id,
      report.author_id,
      report.report_date,
      report.approaches,
      report.gospel_presentations,
      report.professions_of_faith,
      report.reconciliations,
      report.referrals,
      report.prayer_requests,
      report.notes,
      report.timestamp,
      report.timestamp,
    ],
  );
}

/** Reports filed offline that still need pushing to the server. */
export async function listPendingReports(): Promise<EvangelismReportRow[]> {
  const db = await getDb();
  return db.getAllAsync<EvangelismReportRow>(
    `SELECT * FROM evangelism_reports
     WHERE pending_sync = 1 AND deleted_at IS NULL
     ORDER BY created_at`,
  );
}

/** Clears the pending flag once the report has been pushed to the server. */
export async function clearPendingReportSync(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE evangelism_reports SET pending_sync = 0 WHERE id = ?', [id]);
}
