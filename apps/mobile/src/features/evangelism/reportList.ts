// Pure helpers for the trip-detail evangelism report list (no RN imports so they
// are unit testable, like dates.ts). A trip day is "available" once it is today or
// past, and "future" while still ahead — future days are shown but not fillable.
import type { EvangelismReportRow } from '@/db/types';

export type DayStatus = 'empty' | 'pending' | 'filled';

/**
 * Split enumerated trip days into the ones available to fill (day <= today) and the
 * ones still ahead (day > today). Day strings are zero-padded YYYY-MM-DD, so a
 * lexical comparison equals a chronological one. `available` is returned newest-first
 * (today on top, easiest to reach); `future` nearest-first (next upcoming on top).
 */
export function splitTripDays(
  days: readonly string[],
  today: string,
): { available: string[]; future: string[] } {
  const available: string[] = [];
  const future: string[] = [];
  for (const day of days) {
    if (day <= today) available.push(day);
    else future.push(day);
  }
  return { available: available.reverse(), future };
}

/**
 * Map each day to its 1-based position in the trip window (the "Dia N" label), from
 * the ascending list produced by enumerateTripDays.
 */
export function dayNumberMap(days: readonly string[]): Map<string, number> {
  const map = new Map<string, number>();
  days.forEach((day, index) => map.set(day, index + 1));
  return map;
}

/**
 * Fill status per day, keyed by report_date. A row exists once a leader saves the
 * day; `pending_sync` marks it as not yet pushed to the server (offline outbox).
 */
export function buildStatusMap(reports: readonly EvangelismReportRow[]): Map<string, DayStatus> {
  const map = new Map<string, DayStatus>();
  for (const report of reports) {
    map.set(report.report_date, report.pending_sync ? 'pending' : 'filled');
  }
  return map;
}

/** Status for a day, defaulting to 'empty' when no report row exists. */
export function dayStatus(map: Map<string, DayStatus>, day: string): DayStatus {
  return map.get(day) ?? 'empty';
}
