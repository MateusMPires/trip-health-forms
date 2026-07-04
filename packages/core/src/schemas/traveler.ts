import { z } from 'zod';
import { TRAVELER_SEX } from '../constants/enums';
import { PHONE_CELULAR_REGEX, PHONE_INVALID_MESSAGE } from '../constants/phone';
import { isValidCPF, CPF_INVALID_MESSAGE } from '../constants/cpf';

// Mirrors public.travelers (write side of the public form). Every personal field is required
// except email (a teen may not have one). birth_date is an ISO date string ("YYYY-MM-DD");
// is_minor is computed, never stored.
export const travelerInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    full_name: z.string().trim().min(1, 'Informe o nome completo'),
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de nascimento'),
    // Kept nullish so the form's default (null) type-checks; required via superRefine below,
    // since z.enum has no valid "unselected" member.
    sex: z.enum(TRAVELER_SEX).nullish(),
    document: z.string().trim().min(1, 'Informe o CPF').refine(isValidCPF, CPF_INVALID_MESSAGE),
    phone: z.string().trim().regex(PHONE_CELULAR_REGEX, PHONE_INVALID_MESSAGE),
    email: z.string().email('Informe um e-mail válido').nullish(),
    notes: z.string().nullish(),
  })
  .superRefine((t, ctx) => {
    if (!t.sex) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sex'], message: 'Selecione o sexo' });
    }
  });

export type TravelerInput = z.infer<typeof travelerInputSchema>;
