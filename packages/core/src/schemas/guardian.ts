import { z } from 'zod';
import { PHONE_CELULAR_REGEX, PHONE_INVALID_MESSAGE } from '../constants/phone';
import { GUARDIAN_ABSENT_SENTINEL } from '../constants/enums';
import { isValidCPF, CPF_INVALID_MESSAGE } from '../constants/cpf';

// Mirrors public.guardians. Both emergency contacts are required (phone_secondary is the
// second contact, added in 0014); relationship/document stay optional. When a document is
// given it must be a valid CPF — the "xx" adult sentinel and an empty value are allowed.
export const guardianInputSchema = z.object({
  full_name: z.string().trim().min(1, 'guardian full_name is required'),
  relationship: z.string().trim().nullish(),
  document: z
    .string()
    .trim()
    .nullish()
    .refine((v) => !v || v === GUARDIAN_ABSENT_SENTINEL || isValidCPF(v), CPF_INVALID_MESSAGE),
  phone: z.string().trim().regex(PHONE_CELULAR_REGEX, PHONE_INVALID_MESSAGE),
  phone_secondary: z.string().trim().regex(PHONE_CELULAR_REGEX, PHONE_INVALID_MESSAGE),
  email: z.string().email().nullish(),
});

export type GuardianInput = z.infer<typeof guardianInputSchema>;
