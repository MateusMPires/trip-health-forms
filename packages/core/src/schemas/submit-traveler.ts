import { z } from 'zod';
import { travelerInputSchema } from './traveler';
import { guardianInputSchema } from './guardian';
import { healthInputSchema } from './health';
import { consentInputSchema } from './consent';
import { documentInputSchema } from './document';
import { hasResponsibleGuardian, hasRequiredConsents } from '../validation/rules';
import { isMinor } from '../validation/is-minor';
import { GUARDIAN_ABSENT_SENTINEL } from '../constants/enums';

// The exact object serialized to the submit_traveler(code, payload) RPC. Keep the keys and
// nesting aligned with supabase/migrations/0014_health_form_fields.sql.
export const submitTravelerPayloadSchema = z
  .object({
    traveler: travelerInputSchema,
    guardians: z.array(guardianInputSchema).default([]),
    health: healthInputSchema.optional(),
    consents: z.array(consentInputSchema).default([]),
    documents: z.array(documentInputSchema).default([]),
  })
  .superRefine((payload, ctx) => {
    // LGPD terms + medical-care authorization must be accepted (server also gates LGPD).
    if (!hasRequiredConsents(payload.consents)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['consents'],
        message: 'lgpd_terms and medical_care consents must be present and accepted',
      });
    }

    // A minor requires a responsible guardian (rule lives here, not in the DB).
    if (isMinor(payload.traveler.birth_date, new Date())) {
      if (!hasResponsibleGuardian(payload.guardians)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardians'],
          message: 'a minor traveler requires a responsible guardian',
        });
      }
      // For a minor the guardian's CPF is mandatory (the field is only shown for minors).
      // An empty value or the adult 'xx' sentinel is not acceptable here; format is checked
      // by guardianInputSchema, so this only enforces presence.
      const document = payload.guardians[0]?.document?.trim();
      if (!document || document === GUARDIAN_ABSENT_SENTINEL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardians', 0, 'document'],
          message: 'Informe o CPF do responsável',
        });
      }
    }
  });

export type SubmitTravelerPayload = z.infer<typeof submitTravelerPayloadSchema>;
