import { z } from 'zod';
import { travelerInputSchema } from './traveler';
import { guardianInputSchema } from './guardian';
import { healthInputSchema } from './health';
import { consentInputSchema } from './consent';
import { documentInputSchema } from './document';
import { hasResponsibleGuardian, hasRequiredConsents } from '../validation/rules';
import { isMinor } from '../validation/is-minor';

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
    if (isMinor(payload.traveler.birth_date, new Date()) && !hasResponsibleGuardian(payload.guardians)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guardians'],
        message: 'a minor traveler requires a responsible guardian',
      });
    }
  });

export type SubmitTravelerPayload = z.infer<typeof submitTravelerPayloadSchema>;
