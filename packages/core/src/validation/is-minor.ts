import { MINOR_AGE_THRESHOLD } from '../constants/health';

/**
 * Whether a traveler is a minor at a given reference date.
 *
 * Kept in code (not the DB) because it depends on a non-immutable reference date — the
 * caller must pass `reference` explicitly (usually the submission date / today).
 * Returns `false` when the birth date is unknown: minority can't be asserted, and the
 * public form instead infers it from the presence of a responsible guardian.
 */
export function isMinor(
  birthDate: string | Date | null | undefined,
  reference: Date,
): boolean {
  if (birthDate == null || birthDate === '') return false;

  const birth = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age < MINOR_AGE_THRESHOLD;
}
