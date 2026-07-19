// Pure date helpers for the evangelism day list (no RN imports so they are unit
// testable). Days come derived from the trip window (trips.starts_at..ends_at) —
// reports are materialized lazily when a leader fills a day.

/** Local calendar date as YYYY-MM-DD (device timezone). */
export function todayIso(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Inclusive list of YYYY-MM-DD days between starts_at and ends_at. Empty when
 * either bound is missing/malformed or the range is inverted. Iterates in UTC so a
 * DST transition never skips or repeats a day.
 */
export function enumerateTripDays(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string[] {
  const start = parseIsoDate(startsAt);
  const end = parseIsoDate(endsAt);
  if (!start || !end || start > end) return [];

  const days: string[] = [];
  for (let t = start; t <= end; t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Whether an ISO day falls within the (inclusive) trip window. */
export function isWithinTripWindow(
  day: string,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): boolean {
  const start = parseIsoDate(startsAt);
  const end = parseIsoDate(endsAt);
  const target = parseIsoDate(day);
  if (!target) return false;
  if (start && target < start) return false;
  if (end && target > end) return false;
  return true;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a YYYY-MM-DD (or ISO timestamp) to a UTC-midnight epoch, or null. */
function parseIsoDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const t = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(t) ? null : t;
}
