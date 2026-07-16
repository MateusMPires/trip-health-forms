// Deterministic list helpers (no RN imports — unit-tested): Contacts-style
// alphabetical sections and diacritic-insensitive search.

export type NamedRow = { full_name: string };
export type Section<T> = { title: string; data: T[] };

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function matchesQuery(row: NamedRow, query: string): boolean {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return normalize(row.full_name).includes(needle);
}

/** Groups rows (assumed name-sorted) into A–Z sections; non-letters go under '#'. */
export function sectionsByInitial<T extends NamedRow>(rows: readonly T[], query = ''): Section<T>[] {
  const sections = new Map<string, T[]>();
  for (const row of rows) {
    if (!matchesQuery(row, query)) continue;
    const first = normalize(row.full_name.trim()).charAt(0);
    const title = /[a-z]/.test(first) ? first.toUpperCase() : '#';
    const bucket = sections.get(title);
    if (bucket) {
      bucket.push(row);
    } else {
      sections.set(title, [row]);
    }
  }
  return [...sections.entries()]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([title, data]) => ({ title, data }));
}
