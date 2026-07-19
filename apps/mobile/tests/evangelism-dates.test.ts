import { describe, expect, it } from 'vitest';

import { enumerateTripDays, isWithinTripWindow, todayIso } from '@/features/evangelism/dates';

describe('enumerateTripDays', () => {
  it('lists every day in the inclusive window', () => {
    expect(enumerateTripDays('2026-07-14', '2026-07-17')).toEqual([
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
    ]);
  });

  it('returns a single day when start equals end', () => {
    expect(enumerateTripDays('2026-07-14', '2026-07-14')).toEqual(['2026-07-14']);
  });

  it('crosses a month boundary without skipping days', () => {
    expect(enumerateTripDays('2026-07-30', '2026-08-01')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ]);
  });

  it('returns [] for missing bounds or an inverted range', () => {
    expect(enumerateTripDays(null, '2026-07-17')).toEqual([]);
    expect(enumerateTripDays('2026-07-17', null)).toEqual([]);
    expect(enumerateTripDays('2026-07-17', '2026-07-14')).toEqual([]);
  });
});

describe('isWithinTripWindow', () => {
  it('accepts the boundary days and rejects days outside', () => {
    expect(isWithinTripWindow('2026-07-14', '2026-07-14', '2026-07-17')).toBe(true);
    expect(isWithinTripWindow('2026-07-17', '2026-07-14', '2026-07-17')).toBe(true);
    expect(isWithinTripWindow('2026-07-13', '2026-07-14', '2026-07-17')).toBe(false);
    expect(isWithinTripWindow('2026-07-18', '2026-07-14', '2026-07-17')).toBe(false);
  });
});

describe('todayIso', () => {
  it('formats the local calendar date as YYYY-MM-DD', () => {
    // Fixed local date (Jan 5, 2026) — zero-padded month and day.
    expect(todayIso(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05');
  });
});
