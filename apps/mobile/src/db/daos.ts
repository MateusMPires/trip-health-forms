// All local SQL lives here — features never write SQL themselves (CLAUDE.md).
// Reads filter soft-deleted rows; the sync engine still mirrors them so
// deletions propagate offline.
import type { SQLiteBindValue } from 'expo-sqlite';

import type { SyncTable } from '@/lib/config';

import { getDb } from './client';
import { MIRROR_COLUMNS } from './schema';
import type {
  ConsentRow,
  DocumentRow,
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
 * Whether the current user is an administrator of the trip, read from the local
 * mirror (works offline). RLS lets a member read their own trip_members row.
 */
export async function isCurrentUserTripAdmin(tripId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ role: string }>(
    `SELECT role FROM trip_members
     WHERE trip_id = ? AND user_id = ? AND deleted_at IS NULL`,
    [tripId, userId],
  );
  return row?.role === 'administrator';
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
