import { z } from 'zod';

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
// scans quickly + the structured `data` block. Booleans are nullable (null = unanswered).
export const healthInputSchema = z.object({
  // Free-text anchors.
  blood_type: z.string().nullish(),
  allergies: z.string().nullish(),
  medications: z.string().nullish(),
  medical_conditions: z.string().nullish(),
  dietary_restrictions: z.string().nullish(),
  health_insurance: z.string().nullish(),
  notes: z.string().nullish(),
  physical_limitation_description: z.string().nullish(),
  // Yes/no flags.
  has_health_insurance: z.boolean().nullish(),
  has_medical_conditions: z.boolean().nullish(),
  has_allergies: z.boolean().nullish(),
  uses_continuous_medication: z.boolean().nullish(),
  needs_medication_on_trip: z.boolean().nullish(),
  has_physical_limitation: z.boolean().nullish(),
  // Structured long-tail.
  data: healthDataSchema.default({}),
});

export type HealthInput = z.infer<typeof healthInputSchema>;
