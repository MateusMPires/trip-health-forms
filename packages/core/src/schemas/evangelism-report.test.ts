import { describe, expect, it } from 'vitest';

import { evangelismReportInputSchema } from './evangelism-report';

function validReport() {
  return {
    report_date: '2026-07-15',
    approaches: 12,
    gospel_presentations: 8,
    professions_of_faith: 3,
    reconciliations: 1,
    referrals: 2,
    prayer_requests: 5,
    notes: 'Praça central, período da tarde.',
  };
}

describe('evangelismReportInputSchema', () => {
  it('parses a complete valid report', () => {
    const parsed = evangelismReportInputSchema.parse(validReport());
    expect(parsed.professions_of_faith).toBe(3);
    expect(parsed.notes).toBe('Praça central, período da tarde.');
  });

  it('accepts a report with no notes and all zero counters', () => {
    const result = evangelismReportInputSchema.safeParse({
      report_date: '2026-07-15',
      approaches: 0,
      gospel_presentations: 0,
      professions_of_faith: 0,
      reconciliations: 0,
      referrals: 0,
      prayer_requests: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative counter', () => {
    const report = { ...validReport(), approaches: -1 };
    expect(evangelismReportInputSchema.safeParse(report).success).toBe(false);
  });

  it('rejects a non-integer counter', () => {
    const report = { ...validReport(), referrals: 2.5 };
    expect(evangelismReportInputSchema.safeParse(report).success).toBe(false);
  });

  it('rejects a malformed report_date', () => {
    const report = { ...validReport(), report_date: '15/07/2026' };
    expect(evangelismReportInputSchema.safeParse(report).success).toBe(false);
  });

  it('rejects an over-long notes value', () => {
    const report = { ...validReport(), notes: 'a'.repeat(2001) };
    expect(evangelismReportInputSchema.safeParse(report).success).toBe(false);
  });

  it('rejects a metric above the number of people approached', () => {
    // 7 people approached but 10 professions of faith is impossible.
    const report = {
      ...validReport(),
      approaches: 7,
      gospel_presentations: 6,
      professions_of_faith: 10,
    };
    const result = evangelismReportInputSchema.safeParse(report);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['professions_of_faith']);
    }
  });

  it('accepts a metric equal to the number of people approached', () => {
    const report = { ...validReport(), approaches: 5, gospel_presentations: 5, professions_of_faith: 5 };
    expect(evangelismReportInputSchema.safeParse(report).success).toBe(true);
  });

  it('caps every funnel metric, not just one', () => {
    const report = {
      ...validReport(),
      approaches: 2,
      gospel_presentations: 3,
      professions_of_faith: 3,
      reconciliations: 3,
      referrals: 3,
      prayer_requests: 3,
    };
    const result = evangelismReportInputSchema.safeParse(report);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(5);
    }
  });
});
