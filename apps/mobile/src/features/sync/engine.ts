// Pull-based sync engine: Supabase → SQLite mirror, server-wins. The app never
// writes back; the local mirror is disposable and reconstructible. Errors thrown
// here must never carry row data (no sensitive data in logs/crash reports).
//
// Document binaries are NOT downloaded here: prefetching can take minutes and
// must not hold up the sync result — the SyncProvider kicks it off in the
// background once the pull lands and the mirror is usable.
import { upsertMirrorRows, getSyncCursor, setSyncCursor } from '@/db/daos';
import { SYNC_PAGE_SIZE, SYNC_TABLES, type SyncTable } from '@/lib/config';
import { supabase } from '@/lib/supabase';

import { pushPendingDocuments } from '../documents/upload';
import { pushPendingReports } from '../evangelism/push';
import { nextCursor, serializeRowForMirror } from './transform';

/** Progress of a running sync, reported before each step starts. */
export type SyncProgress = {
  /** 0-based step index: the outbox push, then one step per mirrored table. */
  step: number;
  totalSteps: number;
  /** Table being pulled; null during the outbox push step. */
  table: SyncTable | null;
};

export type SyncProgressListener = (progress: SyncProgress) => void;

async function pullTable(table: SyncTable): Promise<number> {
  const cursor = await getSyncCursor(table);
  let newCursor = cursor;
  let offset = 0;
  let total = 0;

  for (;;) {
    // gte (not gt) so rows sharing the cursor timestamp are never skipped; the
    // small overlap is harmless because the upsert is idempotent.
    let query = supabase
      .from(table)
      .select('*')
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + SYNC_PAGE_SIZE - 1);
    if (cursor) query = query.gte('updated_at', cursor);

    const { data, error } = await query;
    if (error) {
      throw new Error(`sync pull failed for ${table}: ${error.code ?? error.message}`);
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    if (rows.length === 0) break;

    await upsertMirrorRows(
      table,
      rows.map((row) => serializeRowForMirror(table, row)),
    );
    newCursor = nextCursor(newCursor, rows);
    total += rows.length;

    if (rows.length < SYNC_PAGE_SIZE) break;
    offset += SYNC_PAGE_SIZE;
  }

  await setSyncCursor(table, newCursor, new Date().toISOString());
  return total;
}

/**
 * Push any offline-filed writes first — documents and evangelism reports — so the
 * pull reconciles them, then a full pull in dependency order (parents before
 * children). These pushes are the app's only write-back; everything else stays
 * read-only / server-wins.
 */
export async function runSync(
  onProgress?: SyncProgressListener,
): Promise<{ pulledRows: number }> {
  const totalSteps = SYNC_TABLES.length + 1;
  onProgress?.({ step: 0, totalSteps, table: null });
  await pushPendingDocuments();
  await pushPendingReports();

  let pulledRows = 0;
  for (const [index, table] of SYNC_TABLES.entries()) {
    onProgress?.({ step: index + 1, totalSteps, table });
    pulledRows += await pullTable(table);
  }
  return { pulledRows };
}
