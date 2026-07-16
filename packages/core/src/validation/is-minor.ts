import { MINOR_AGE_THRESHOLD, NATIONAL_TRAVEL_AUTH_MAX_AGE } from '../constants/health';

/**
 * Full years between a birth date and a reference date, or `null` when the birth date
 * is unknown/invalid. Age-based rules live in code (not the DB) because they depend on a
 * non-immutable reference date — the caller passes `reference` explicitly (usually today).
 */
export function ageAt(
  birthDate: string | Date | null | undefined,
  reference: Date,
): number | null {
  if (birthDate == null || birthDate === '') return null;

  const birth = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Whether a traveler is a minor at a given reference date.
 *
 * Returns `false` when the birth date is unknown: minority can't be asserted, and the
 * public form instead infers it from the presence of a responsible guardian.
 */
export function isMinor(
  birthDate: string | Date | null | undefined,
  reference: Date,
): boolean {
  const age = ageAt(birthDate, reference);
  return age !== null && age < MINOR_AGE_THRESHOLD;
}

/**
 * Whether a traveler needs a national travel authorization document (Autorização de Viagem
 * Nacional) — i.e. is under NATIONAL_TRAVEL_AUTH_MAX_AGE at the reference date. Returns
 * `false` when the birth date is unknown (can't assert the requirement).
 */
export function requiresNationalTravelAuthorization(
  birthDate: string | Date | null | undefined,
  reference: Date,
): boolean {
  const age = ageAt(birthDate, reference);
  return age !== null && age < NATIONAL_TRAVEL_AUTH_MAX_AGE;
}
