import { describe, expect, it } from 'vitest';

import { formatMonthYear, formatName } from '@/lib/format';

describe('formatName', () => {
  it('title-cases each word: upper initial, lower remainder', () => {
    expect(formatName('MARIA SILVA')).toBe('Maria Silva');
    expect(formatName('joão pedro')).toBe('João Pedro');
    expect(formatName('bRuNo LiMa')).toBe('Bruno Lima');
  });

  it('keeps PT-BR connectors lowercase mid-name', () => {
    expect(formatName('MARIA DA SILVA')).toBe('Maria da Silva');
    expect(formatName('joão dos santos e costa')).toBe('João dos Santos e Costa');
  });

  it('capitalizes a connector when it leads the name', () => {
    expect(formatName('da silva')).toBe('Da Silva');
  });

  it('handles hyphenated names', () => {
    expect(formatName('ANA-MARIA souza')).toBe('Ana-Maria Souza');
  });

  it('collapses extra whitespace and trims', () => {
    expect(formatName('  pedro   alves  ')).toBe('Pedro Alves');
  });

  it('returns empty string for nullish or blank input', () => {
    expect(formatName('')).toBe('');
    expect(formatName(null)).toBe('');
    expect(formatName(undefined)).toBe('');
  });
});

describe('formatMonthYear', () => {
  it('formats date-only and ISO timestamps to the PT-BR month', () => {
    expect(formatMonthYear('2026-07-04')).toBe('Julho de 2026');
    expect(formatMonthYear('2025-12-31T23:00:00Z')).toBe('Dezembro de 2025');
  });

  it('returns null for nullish, unparseable or out-of-range input', () => {
    expect(formatMonthYear(null)).toBeNull();
    expect(formatMonthYear(undefined)).toBeNull();
    expect(formatMonthYear('04/07/2026')).toBeNull();
    expect(formatMonthYear('2026-13-01')).toBeNull();
  });
});
