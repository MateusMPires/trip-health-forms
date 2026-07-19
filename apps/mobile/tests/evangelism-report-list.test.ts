import { describe, expect, it } from 'vitest';

import type { EvangelismReportRow } from '@/db/types';
import {
  buildStatusMap,
  dayNumberMap,
  dayStatus,
  splitTripDays,
} from '@/features/evangelism/reportList';

/** Minimal report row for status tests — only report_date and pending_sync matter here. */
function report(reportDate: string, pendingSync: number | null): EvangelismReportRow {
  return {
    id: `id-${reportDate}`,
    organization_id: 'org',
    trip_id: 'trip',
    author_id: 'author',
    report_date: reportDate,
    approaches: 0,
    gospel_presentations: 0,
    professions_of_faith: 0,
    reconciliations: 0,
    referrals: 0,
    prayer_requests: 0,
    notes: null,
    created_at: '2026-07-15T00:00:00.000Z',
    updated_at: '2026-07-15T00:00:00.000Z',
    pending_sync: pendingSync,
  };
}

describe('splitTripDays', () => {
  const days = ['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18'];

  it('puts today (and past) in available, and later days in future', () => {
    const { available, future } = splitTripDays(days, '2026-07-16');
    // available is newest-first (today on top).
    expect(available).toEqual(['2026-07-16', '2026-07-15', '2026-07-14']);
    // future is nearest-first (next upcoming on top).
    expect(future).toEqual(['2026-07-17', '2026-07-18']);
  });

  it('treats the whole window as available when today is the last day or later', () => {
    expect(splitTripDays(days, '2026-07-18').future).toEqual([]);
    expect(splitTripDays(days, '2026-08-01').available).toEqual([
      '2026-07-18',
      '2026-07-17',
      '2026-07-16',
      '2026-07-15',
      '2026-07-14',
    ]);
  });

  it('treats the whole window as future before the trip starts', () => {
    const { available, future } = splitTripDays(days, '2026-07-01');
    expect(available).toEqual([]);
    expect(future).toEqual(days);
  });

  it('returns empty lists for an empty window', () => {
    expect(splitTripDays([], '2026-07-16')).toEqual({ available: [], future: [] });
  });
});

describe('dayNumberMap', () => {
  it('maps each ascending day to its 1-based trip position', () => {
    const map = dayNumberMap(['2026-07-14', '2026-07-15', '2026-07-16']);
    expect(map.get('2026-07-14')).toBe(1);
    expect(map.get('2026-07-15')).toBe(2);
    expect(map.get('2026-07-16')).toBe(3);
  });
});

describe('buildStatusMap / dayStatus', () => {
  it('marks synced rows filled, unsynced rows pending, and missing days empty', () => {
    const map = buildStatusMap([report('2026-07-14', 0), report('2026-07-15', 1)]);
    expect(dayStatus(map, '2026-07-14')).toBe('filled');
    expect(dayStatus(map, '2026-07-15')).toBe('pending');
    expect(dayStatus(map, '2026-07-16')).toBe('empty');
  });

  it('treats a null pending_sync flag as filled', () => {
    const map = buildStatusMap([report('2026-07-14', null)]);
    expect(dayStatus(map, '2026-07-14')).toBe('filled');
  });
});
