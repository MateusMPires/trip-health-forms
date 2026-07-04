import type { ConsentInput, ConsentKind } from '@viagem/core';
import { TERMS_VERSION } from '@/lib/config';
import type { TravelerForm } from '@/features/traveler-form/hooks/useTravelerForm';

// Upsert one consent row (one per kind) into the form's consents[] array. terms_version is
// stamped from config; ip_address/user_agent are filled at submit time.
export function upsertConsent(form: TravelerForm, kind: ConsentKind, accepted: boolean): void {
  const current = form.getValues('consents') ?? [];
  const next: ConsentInput = {
    kind,
    accepted,
    terms_version: TERMS_VERSION,
    ip_address: null,
    user_agent: null,
  };
  const others = current.filter((c) => c.kind !== kind);
  form.setValue('consents', [...others, next], { shouldDirty: true, shouldValidate: false });
}

// The accepted flag for a kind, or null when the guardian hasn't answered yet.
export function consentValue(consents: ConsentInput[] | undefined, kind: ConsentKind): boolean | null {
  const row = consents?.find((c) => c.kind === kind);
  return row ? row.accepted : null;
}

// Whether a decision (accept OR refuse) has been recorded for a kind.
export function hasConsentAnswer(consents: ConsentInput[] | undefined, kind: ConsentKind): boolean {
  return Boolean(consents?.some((c) => c.kind === kind));
}
