import { z } from 'zod';
import { TRAVELER_SEX } from '../constants/enums';

// Mirrors public.travelers (write side of the public form).
// birth_date is an ISO date string ("YYYY-MM-DD"); is_minor is computed, never stored.
export const travelerInputSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(1, 'full_name is required'),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'birth_date must be YYYY-MM-DD')
    .nullish(),
  sex: z.enum(TRAVELER_SEX).nullish(),
  document: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  email: z.string().email().nullish(),
  notes: z.string().nullish(),
});

export type TravelerInput = z.infer<typeof travelerInputSchema>;
