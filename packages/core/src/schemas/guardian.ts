import { z } from 'zod';

// Mirrors public.guardians. phone_secondary is the second emergency contact (0014).
export const guardianInputSchema = z.object({
  full_name: z.string().trim().min(1, 'guardian full_name is required'),
  relationship: z.string().trim().nullish(),
  document: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  phone_secondary: z.string().trim().nullish(),
  email: z.string().email().nullish(),
});

export type GuardianInput = z.infer<typeof guardianInputSchema>;
