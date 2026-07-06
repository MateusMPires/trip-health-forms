// Custom, non-schema step requirements. Each returns a Portuguese error message to show as a
// banner, or null when the step is complete. Schema-backed fields are validated separately via
// form.trigger() and surface inline.
import { MED_AUTHORIZATION_OPTIONS, type MedAuthorizationCategory } from '@viagem/core';
import { hasConsentAnswer, consentValue } from '@/features/consent/consents';
import { MED_CATEGORY_LABELS } from '@/lib/format';
import type { TravelerForm } from '../hooks/useTravelerForm';

const MED_CATEGORIES = Object.keys(MED_AUTHORIZATION_OPTIONS) as MedAuthorizationCategory[];

export function validatePersonal(form: TravelerForm): string | null {
  const docs = form.getValues('documents') ?? [];
  const identityCount = docs.filter((d) => d.kind === 'identity_document').length;
  return identityCount >= 2
    ? null
    : 'Envie as duas fotos do documento de identidade (frente e verso).';
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
  const answered =
    hasConsentAnswer(consents, 'medication_administration') &&
    hasConsentAnswer(consents, 'self_medication');
  if (!answered) return 'Responda as duas autorizações de medicamentos.';

  // Authorizing administration reveals the per-category checklists — each category needs a pick.
  if (consentValue(consents, 'medication_administration') === true) {
    const auths = form.getValues('health.data.med_authorizations') ?? {};
    const missing = MED_CATEGORIES.filter((cat) => {
      const picks = auths[cat];
      return !Array.isArray(picks) || picks.length === 0;
    });
    if (missing.length > 0) {
      return `Selecione ao menos uma opção em cada categoria de medicamento: ${missing
        .map((cat) => MED_CATEGORY_LABELS[cat])
        .join('; ')}.`;
    }
  }
  return null;
}
