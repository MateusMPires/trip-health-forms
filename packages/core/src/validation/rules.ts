import type { GuardianInput } from '../schemas/guardian';
import type { ConsentInput } from '../schemas/consent';
import { REQUIRED_CONSENT_KINDS, GUARDIAN_ABSENT_SENTINEL } from '../constants/enums';

/**
 * A responsible guardian is one with a real name — not empty and not the "xx" sentinel the
 * form asks adults to type. Used to enforce "a minor requires a responsible guardian".
 */
export function hasResponsibleGuardian(guardians: readonly GuardianInput[]): boolean {
  return guardians.some((g) => {
    const name = g.full_name.trim().toLowerCase();
    return name.length > 0 && name !== GUARDIAN_ABSENT_SENTINEL;
  });
}

/**
 * Whether every consent the platform requires (LGPD terms + medical care) is present and
 * accepted. Mirrors the server-side gate in submit_traveler (which enforces at least the
 * LGPD terms).
 */
export function hasRequiredConsents(consents: readonly ConsentInput[]): boolean {
  return REQUIRED_CONSENT_KINDS.every((kind) =>
    consents.some((c) => c.kind === kind && c.accepted && c.terms_version.trim().length > 0),
  );
}
