import { z } from 'zod';
import { BLOOD_TYPES, INSURANCE_CARD_MIN_LENGTH } from '../constants/health';

// Structured shape of health_records.data — the single source of truth for the multi-select
// checklists, the yes/no history grid and the medication authorizations. Kept in sync 1:1
// with the comment in supabase/migrations/0014_health_form_fields.sql.
// Multi-selects are string arrays (not strict enums) because the form allows "Outra: ___".
export const healthDataSchema = z
  .object({
    medical_conditions: z.array(z.string()).optional(),
    allergy: z
      .object({
        type: z.string().optional(),
        reaction: z.string().optional(),
        seafood: z.string().optional(),
      })
      .optional(),
    // Health plan card, split so the (alphanumeric) card number can be validated on its own.
    // The composed "operator · category · number" is mirrored into health_records.health_insurance.
    insurance: z
      .object({
        operator: z.string().optional(),
        category: z.string().optional(),
        card_number: z.string().optional(),
      })
      .optional(),
    medications_to_carry: z.string().optional(),
    medical_history: z
      .object({
        seizure: z.boolean(),
        fainting: z.boolean(),
        asthma_attack: z.boolean(),
        severe_allergic_reaction: z.boolean(),
        surgery_hospitalization_12m: z.boolean(),
        other: z.boolean(),
      })
      .partial()
      .optional(),
    medical_history_notes: z.string().optional(),
    travel_health_history: z.array(z.string()).optional(),
    med_authorizations: z
      .object({
        analgesics: z.array(z.string()),
        colic: z.array(z.string()),
        nausea: z.array(z.string()),
        mild_allergy: z.array(z.string()),
        other: z.array(z.string()),
      })
      .partial()
      .optional(),
  })
  .strict();

export type HealthData = z.infer<typeof healthDataSchema>;

// Mirrors public.health_records. Anchor free-text columns + typed yes/no flags the nurse
// scans quickly + the structured `data` block. blood_type is a required select; the yes/no
// flags must be answered and each "Sim" makes its detail required (superRefine below).
export const healthInputSchema = z
  .object({
    // Required select (unknown = "Não sei"). Kept nullish so the form default type-checks and
    // an unselected '' surfaces the friendly message; membership is enforced in superRefine.
    blood_type: z.string().nullish(),
    // Free-text anchors.
    allergies: z.string().nullish(),
    medications: z.string().nullish(),
    medical_conditions: z.string().nullish(),
    dietary_restrictions: z.string().nullish(),
    health_insurance: z.string().nullish(),
    notes: z.string().nullish(),
    physical_limitation_description: z.string().nullish(),
    // Yes/no flags (null = unanswered).
    has_health_insurance: z.boolean().nullish(),
    has_medical_conditions: z.boolean().nullish(),
    has_allergies: z.boolean().nullish(),
    uses_continuous_medication: z.boolean().nullish(),
    needs_medication_on_trip: z.boolean().nullish(),
    has_physical_limitation: z.boolean().nullish(),
    has_dietary_restriction: z.boolean().nullish(),
    // Structured long-tail.
    data: healthDataSchema.default({}),
  })
  .superRefine((h, ctx) => {
    // Blood type must be one of the known options (unknown = "Não sei").
    if (!h.blood_type || !(BLOOD_TYPES as readonly string[]).includes(h.blood_type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blood_type'],
        message: 'Selecione o tipo sanguíneo',
      });
    }
    const answer = (value: boolean | null | undefined, path: string) => {
      if (value !== true && value !== false) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: 'Responda esta pergunta' });
      }
    };
    // Every yes/no question must be answered.
    answer(h.has_health_insurance, 'has_health_insurance');
    answer(h.has_medical_conditions, 'has_medical_conditions');
    answer(h.has_allergies, 'has_allergies');
    answer(h.uses_continuous_medication, 'uses_continuous_medication');
    answer(h.needs_medication_on_trip, 'needs_medication_on_trip');
    answer(h.has_physical_limitation, 'has_physical_limitation');
    answer(h.has_dietary_restriction, 'has_dietary_restriction');

    const require = (condition: boolean, path: (string | number)[], message: string) => {
      if (condition) ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    // "Sim" ⇒ the revealed detail is required.
    require(
      h.has_medical_conditions === true && (h.data?.medical_conditions?.length ?? 0) === 0,
      ['data', 'medical_conditions'],
      'Selecione pelo menos uma condição',
    );
    require(
      h.has_allergies === true && !h.data?.allergy?.type?.trim(),
      ['data', 'allergy', 'type'],
      'Selecione o tipo de alergia',
    );
    require(
      h.uses_continuous_medication === true && !h.medications?.trim(),
      ['medications'],
      'Liste os medicamentos de uso contínuo',
    );
    require(
      h.needs_medication_on_trip === true && !h.data?.medications_to_carry?.trim(),
      ['data', 'medications_to_carry'],
      'Liste os medicamentos que precisará portar',
    );
    require(
      h.has_physical_limitation === true && !h.physical_limitation_description?.trim(),
      ['physical_limitation_description'],
      'Descreva a limitação física ou necessidade especial',
    );
    require(
      h.has_health_insurance === true && !h.data?.insurance?.operator?.trim(),
      ['data', 'insurance', 'operator'],
      'Informe a operadora do plano',
    );
    require(
      h.has_health_insurance === true &&
        (h.data?.insurance?.card_number?.trim().length ?? 0) < INSURANCE_CARD_MIN_LENGTH,
      ['data', 'insurance', 'card_number'],
      'Informe o número da carteirinha',
    );
    require(
      h.has_dietary_restriction === true && !h.dietary_restrictions?.trim(),
      ['dietary_restrictions'],
      'Descreva a restrição alimentar',
    );
  });

export type HealthInput = z.infer<typeof healthInputSchema>;
