// Deterministic half of the sync engine (no React Native / Expo imports so it is
// unit-testable): remote row → SQLite mirror row, and cursor advancement.
import type { SyncTable } from '@/lib/config';
import { MIRROR_COLUMNS } from '@/db/schema';

export type MirrorValue = string | number | null;
export type SerializedRow = Record<string, MirrorValue>;

function serializeValue(value: unknown): MirrorValue {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string' || typeof value === 'number') return value;
  // jsonb payloads (e.g. health_records.data) are stored as JSON text.
  return JSON.stringify(value);
}

/**
 * Picks only the mirrored (server-owned) columns of a remote row and coerces the
 * values to SQLite-storable primitives. Extra remote columns are dropped; missing
 * ones become NULL. Soft-deleted rows pass through untouched — mirroring
 * `deleted_at` is how deletions propagate offline.
 */
export function serializeRowForMirror(
  table: SyncTable,
  row: Record<string, unknown>,
): SerializedRow {
  const out: SerializedRow = {};
  for (const column of MIRROR_COLUMNS[table]) {
    out[column] = serializeValue(row[column]);
  }
  return out;
}

/**
 * Advances the incremental cursor to the greatest `updated_at` seen. Timestamps
 * are compared lexicographically — PostgREST returns them in a fixed ISO-8601
 * UTC format, so string order equals time order. Server-wins: the cursor only
 * moves forward, never back.
 */
export function nextCursor(
  current: string | null,
  rows: readonly { updated_at?: unknown }[],
): string | null {
  let max = current;
  for (const row of rows) {
    const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;
    if (updatedAt && (max === null || updatedAt > max)) {
      max = updatedAt;
    }
  }
  return max;
}
