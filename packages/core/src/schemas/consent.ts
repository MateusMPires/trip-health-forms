import { z } from 'zod';
import { CONSENT_KINDS } from '../constants/enums';

// Mirrors public.consents (0014): one row per authorization kind. `accepted` may be false
// (an explicit "did not authorize" is meaningful), but terms_version is always required.
export const consentInputSchema = z.object({
  kind: z.enum(CONSENT_KINDS),
  accepted: z.boolean(),
  terms_version: z.string().trim().min(1, 'terms_version is required'),
  ip_address: z.string().nullish(),
  user_agent: z.string().nullish(),
});

export type ConsentInput = z.infer<typeof consentInputSchema>;
