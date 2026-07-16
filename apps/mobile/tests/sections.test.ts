import { describe, expect, it } from 'vitest';

import { matchesQuery, sectionsByInitial } from '@/features/travelers/sections';
import { sectionsByMonth } from '@/features/trips/sections';

const travelers = [
  { full_name: 'Acai Pracinha' },
  { full_name: 'Álef Costa' },
  { full_name: 'Bruno Lima' },
  { full_name: '2Pac Tributo' },
];

describe('sectionsByInitial', () => {
  it('groups by first letter, folding diacritics (Á → A)', () => {
    const sections = sectionsByInitial(travelers);
    expect(sections.map((section) => section.title)).toEqual(['A', 'B', '#']);
    expect(sections[0].data.map((row) => row.full_name)).toEqual([
      'Acai Pracinha',
      'Álef Costa',
    ]);
  });

  it('puts non-letter initials under #, sorted last', () => {
    const sections = sectionsByInitial(travelers);
    expect(sections[sections.length - 1]).toEqual({
      title: '#',
      data: [{ full_name: '2Pac Tributo' }],
    });
  });

  it('filters by query before grouping', () => {
    const sections = sectionsByInitial(travelers, 'bruno');
    expect(sections).toEqual([{ title: 'B', data: [{ full_name: 'Bruno Lima' }] }]);
  });
});

describe('matchesQuery', () => {
  it('is case- and diacritic-insensitive', () => {
    expect(matchesQuery({ full_name: 'Álef Costa' }, 'alef')).toBe(true);
    expect(matchesQuery({ full_name: 'Bruno' }, 'BRU')).toBe(true);
    expect(matchesQuery({ full_name: 'Bruno' }, 'ana')).toBe(false);
  });

  it('matches everything on an empty query', () => {
    expect(matchesQuery({ full_name: 'Qualquer Nome' }, '  ')).toBe(true);
  });
});

describe('sectionsByMonth', () => {
  const trips = [
    { name: 'Acampamento', starts_at: '2026-07-20' },
    { name: 'Missão Norte', starts_at: '2026-07-04' },
    { name: 'Retiro', starts_at: '2026-01-10' },
    { name: 'Sem planejamento', starts_at: null },
  ];

  it('groups by start-date month preserving row order', () => {
    const sections = sectionsByMonth(trips);
    expect(sections.map((section) => section.title)).toEqual([
      'Julho de 2026',
      'Janeiro de 2026',
      'Sem data',
    ]);
    expect(sections[0].data.map((trip) => trip.name)).toEqual([
      'Acampamento',
      'Missão Norte',
    ]);
  });

  it('puts undated trips in a "Sem data" section, sorted last', () => {
    const sections = sectionsByMonth([
      { name: 'Sem data primeiro', starts_at: null },
      { name: 'Com data', starts_at: '2026-03-01' },
    ]);
    expect(sections.map((section) => section.title)).toEqual(['Março de 2026', 'Sem data']);
  });

  it('returns no sections for an empty list', () => {
    expect(sectionsByMonth([])).toEqual([]);
  });
});
