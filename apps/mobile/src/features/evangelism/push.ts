// Offline-first evangelism reports (group-leader only). Filing a day is 100% local:
// a row is written to the mirror with `pending_sync = 1`, so it shows instantly and
// works offline. The sync engine later pushes it to Supabase (see pushPendingReports)
// and the next pull reconciles by id (server-wins).
//
// This is a write-back exception to the read-mostly app, alongside document upload.
// These are aggregate counts (no personal data of the people evangelized), but never
// log rows anyway — keep errors data-free.
import { clearPendingReportSync, listPendingReports } from '@/db/daos';
import type { EvangelismReportRow } from '@/db/types';
import { supabase } from '@/lib/supabase';

/**
 * Pushes one pending report: upsert by id (idempotent — re-filing a day reuses the
 * same id; a partial prior push just updates the same row). The unique
 * (trip, author, date) index is enforced server-side; a rare cross-device
 * duplicate (code 23505) is treated as already-present and the pull reconciles it.
 */
async function pushReport(report: EvangelismReportRow): Promise<void> {
  const { error } = await supabase.from('evangelism_reports').upsert(
    {
      id: report.id,
      organization_id: report.organization_id,
      trip_id: report.trip_id,
      author_id: report.author_id,
      report_date: report.report_date,
      approaches: report.approaches,
      gospel_presentations: report.gospel_presentations,
      professions_of_faith: report.professions_of_faith,
      reconciliations: report.reconciliations,
      referrals: report.referrals,
      prayer_requests: report.prayer_requests,
      notes: report.notes,
    },
    { onConflict: 'id' },
  );
  // 23505 = unique_violation on (trip, author, date): a row already exists from
  // another device. Server-wins — clear the flag and let the pull reconcile.
  if (error && error.code !== '23505') throw error;

  await clearPendingReportSync(report.id);
}

/**
 * Drains the offline outbox — pushes every pending report. Best-effort: a failure on
 * one report (offline / transient) leaves it pending for the next sync and does not
 * block the others. Called at the start of runSync, before the pull reconciles.
 */
export async function pushPendingReports(): Promise<void> {
  const pending = await listPendingReports();
  for (const report of pending) {
    try {
      await pushReport(report);
    } catch {
      // Keep pending_sync = 1 and retry on the next sync. No details logged.
    }
  }
}
