// Deterministic list helpers (no RN imports — unit-tested): trips grouped by
// the month of their start date, preserving the DAO order (recent first).
import { formatMonthYear } from '@/lib/format';

export type Section<T> = { title: string; data: T[] };

export const UNDATED_SECTION_TITLE = 'Sem data';

/** Groups rows (assumed date-sorted) into month sections; undated rows go last. */
export function sectionsByMonth<T extends { starts_at: string | null }>(
  rows: readonly T[],
): Section<T>[] {
  const buckets = new Map<string, T[]>();
  for (const row of rows) {
    const title = formatMonthYear(row.starts_at) ?? UNDATED_SECTION_TITLE;
    const bucket = buckets.get(title);
    if (bucket) {
      bucket.push(row);
    } else {
      buckets.set(title, [row]);
    }
  }
  const sections = [...buckets.entries()].map(([title, data]) => ({ title, data }));
  const undatedIndex = sections.findIndex((s) => s.title === UNDATED_SECTION_TITLE);
  if (undatedIndex !== -1) sections.push(...sections.splice(undatedIndex, 1));
  return sections;
}
