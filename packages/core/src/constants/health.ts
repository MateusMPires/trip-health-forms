// Canonical option lists for the health form checklists (the "FICHA DE SAÚDE" form).
// The DB stores these as free string arrays under health_records.data — these constants
// are the known values the UI renders; a form "Outra: ___" answer is stored verbatim, so
// schemas validate string arrays rather than strict enums.

// Age at/above which a traveler is not a minor (drives is_minor + guardian requirement).
export const MINOR_AGE_THRESHOLD = 18;

// Age below which a traveler needs a national travel authorization document
// (Autorização de Viagem Nacional). Drives requiresNationalTravelAuthorization.
export const NATIONAL_TRAVEL_AUTH_MAX_AGE = 16;

// Blood type options for the required select. `unknown` is the "Não sei" answer — stored
// verbatim in health_records.blood_type (a text column), so no DB enum is needed.
// Minimum length for the (alphanumeric) health-insurance card number.
export const INSURANCE_CARD_MIN_LENGTH = 3;

export const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'unknown',
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

// Page 2 — "Possui alguma doença ou condição médica? Se sim, qual?"
export const MEDICAL_CONDITIONS = [
  'asthma',
  'diabetes',
  'epilepsy',
  'migraine',
  'adhd',
  'asd',
  'anxiety',
  'depression',
  'heart_disease',
  'other',
] as const;
export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number];

// Page 2 — "Qual tipo de alergia?"
export const ALLERGY_TYPES = ['medication', 'food', 'insect', 'other'] as const;
export type AllergyType = (typeof ALLERGY_TYPES)[number];

// Page 2 — "Já apresentou alguma das situações abaixo?" (Sim/Não grid)
export const MEDICAL_HISTORY_ITEMS = [
  'seizure',
  'fainting',
  'asthma_attack',
  'severe_allergic_reaction',
  'surgery_hospitalization_12m',
  'other',
] as const;
export type MedicalHistoryItem = (typeof MEDICAL_HISTORY_ITEMS)[number];

// Page 2 — "Assinale se o adolescente possui histórico de:"
export const TRAVEL_HEALTH_HISTORY = [
  'motion_sickness',
  'heat_sensitivity',
  'sun_sensitivity',
  'sleepwalking',
  'anxiety_crises',
  'insect_animal_fear',
  'dehydration_heatstroke',
  'other',
] as const;
export type TravelHealthHistory = (typeof TRAVEL_HEALTH_HISTORY)[number];

// Pages 3-4 — authorized medication options per category. "none_without_prescription"
// is the "Não autorizo administrar nenhum medicamento sem prescrição médica" option.
export const MED_AUTHORIZATION_OPTIONS = {
  analgesics: ['paracetamol', 'dipyrone', 'ibuprofen', 'none_without_prescription', 'other'],
  colic: ['scopolamine', 'none_without_prescription', 'other'],
  nausea: ['metoclopramide', 'dimenhydrinate', 'ondansetron', 'none_without_prescription', 'other'],
  mild_allergy: ['loratadine', 'cetirizine', 'fexofenadine', 'none_without_prescription', 'other'],
  other: [
    'topical_antiseptics',
    'insect_bite_ointment',
    'diaper_rash_ointment',
    'nasal_saline',
    'lubricant_eye_drops',
    'dressings_bandages',
    'bruise_gel',
  ],
} as const;
export type MedAuthorizationCategory = keyof typeof MED_AUTHORIZATION_OPTIONS;
