// Custom, non-schema step requirements. Each returns a Portuguese error message to show as a
// banner, or null when the step is complete. Schema-backed fields are validated separately via
// form.trigger() and surface inline.
import { hasConsentAnswer } from '@/features/consent/consents';
import type { TravelerForm } from '../hooks/useTravelerForm';

export function validatePersonal(form: TravelerForm): string | null {
  const docs = form.getValues('documents') ?? [];
  const hasIdentity = docs.some((d) => d.kind === 'identity_document');
  return hasIdentity ? null : 'Envie a foto do documento de identidade do adolescente.';
}

// When the traveler has a health plan, the card photo is required.
export function validateInsurance(form: TravelerForm): string | null {
  if (form.getValues('health.has_health_insurance') !== true) return null;
  const docs = form.getValues('documents') ?? [];
  const hasCardPhoto = docs.some((d) => d.kind === 'photo');
  return hasCardPhoto ? null : 'Envie a foto da carteirinha do plano de saúde.';
}

export function validateMedicationAuth(form: TravelerForm): string | null {
  const consents = form.getValues('consents');
  const ok =
    hasConsentAnswer(consents, 'medication_administration') &&
    hasConsentAnswer(consents, 'self_medication');
  return ok ? null : 'Responda as duas autorizações de medicamentos.';
}
