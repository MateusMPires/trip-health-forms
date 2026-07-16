// Deterministic warning-subtitle builder for the travelers list (no RN imports —
// unit-tested): denied authorizations, allergy/dietary flags and minor status.
import { CONSENT_KINDS, type ConsentKind } from '@viagem/core';

import { CONSENT_KIND_LABELS } from '@/lib/format';

export type TravelerAlertRow = {
  denied_consent_kinds: string | null;
  has_allergies: number | null;
  has_dietary_restriction: number | null;
};

const isConsentKind = (value: string): value is ConsentKind =>
  (CONSENT_KINDS as readonly string[]).includes(value);

export type TravelerAlert = {
  /** Safety-critical flags (denied authorizations, allergies…) — warning-colored. */
  warning: string | null;
  /** Informational flags ("Menor de idade") — secondary-colored. */
  info: string | null;
};

/**
 * One-line subtitle content for a traveler row, split by severity, or null when
 * there is nothing to flag. Denied authorizations come first (they are the
 * strongest signal), in the canonical CONSENT_KINDS order so every row reads
 * the same.
 */
export function travelerAlerts(row: TravelerAlertRow, minor: boolean): TravelerAlert | null {
  const warnings: string[] = [];

  const deniedKinds = (row.denied_consent_kinds ?? '')
    .split(',')
    .filter(isConsentKind)
    .sort((a, b) => CONSENT_KINDS.indexOf(a) - CONSENT_KINDS.indexOf(b));
  if (deniedKinds.length > 0) {
    warnings.push(
      `Não autorizou: ${deniedKinds.map((kind) => CONSENT_KIND_LABELS[kind]).join(', ')}`,
    );
  }

  if (row.has_allergies) warnings.push('Alergias');
  if (row.has_dietary_restriction) warnings.push('Restrição alimentar');

  if (warnings.length === 0 && !minor) return null;
  return {
    warning: warnings.length > 0 ? warnings.join(' · ') : null,
    info: minor ? 'Menor de idade' : null,
  };
}
