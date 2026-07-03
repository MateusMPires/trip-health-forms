import { describe, it, expect } from 'vitest';
import { isMinor } from './is-minor';

const reference = new Date('2026-07-03T00:00:00');

describe('isMinor', () => {
  it('is true for a clearly under-18 birth date', () => {
    expect(isMinor('2012-05-01', reference)).toBe(true);
  });

  it('is false for a clearly over-18 birth date', () => {
    expect(isMinor('2000-01-01', reference)).toBe(false);
  });

  it('is false exactly on the 18th birthday', () => {
    expect(isMinor('2008-07-03', reference)).toBe(false);
  });

  it('is true the day before the 18th birthday', () => {
    expect(isMinor('2008-07-04', reference)).toBe(true);
  });

  it('is false when the birth date is unknown', () => {
    expect(isMinor(null, reference)).toBe(false);
    expect(isMinor(undefined, reference)).toBe(false);
    expect(isMinor('', reference)).toBe(false);
  });

  it('is false for an invalid date string', () => {
    expect(isMinor('not-a-date', reference)).toBe(false);
  });
});
