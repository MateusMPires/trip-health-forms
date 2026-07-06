// Portuguese labels for the domain values from @viagem/core. The values themselves stay in
// English (DB contract); only the display text is localized here.
import type { TravelerSex, MedAuthorizationCategory } from '@viagem/core';

export const SEX_LABELS: Record<TravelerSex, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not_say: 'Prefiro não informar',
};

// Blood type options. Real types display verbatim; `unknown` is "Não sei".
export const BLOOD_TYPE_LABELS: Record<string, string> = {
  'A+': 'A+',
  'A-': 'A-',
  'B+': 'B+',
  'B-': 'B-',
  'AB+': 'AB+',
  'AB-': 'AB-',
  'O+': 'O+',
  'O-': 'O-',
  unknown: 'Não sei',
};

export const MEDICAL_CONDITION_LABELS: Record<string, string> = {
  asthma: 'Asma',
  diabetes: 'Diabetes',
  epilepsy: 'Epilepsia',
  migraine: 'Enxaqueca',
  adhd: 'TDAH',
  asd: 'TEA',
  anxiety: 'Ansiedade',
  depression: 'Depressão',
  heart_disease: 'Doença cardíaca',
  other: 'Outra',
};

export const ALLERGY_TYPE_LABELS: Record<string, string> = {
  medication: 'Medicamentos',
  food: 'Alimentos',
  insect: 'Insetos',
  other: 'Outra',
};

export const MEDICAL_HISTORY_LABELS: Record<string, string> = {
  seizure: 'Convulsão',
  fainting: 'Desmaio',
  asthma_attack: 'Crise asmática',
  severe_allergic_reaction: 'Reação alérgica grave',
  surgery_hospitalization_12m: 'Cirurgia ou hospitalização nos últimos 12 meses',
  other: 'Outros',
  none: 'Não apresentei nenhuma das situações descritas',
};

export const TRAVEL_HEALTH_HISTORY_LABELS: Record<string, string> = {
  motion_sickness: 'Tendência a enjoos em viagens',
  heat_sensitivity: 'Sensibilidade ao calor',
  sun_sensitivity: 'Sensibilidade ao sol',
  sleepwalking: 'Sonambulismo',
  anxiety_crises: 'Crises de ansiedade',
  insect_animal_fear: 'Medo intenso de insetos e/ou animais',
  dehydration_heatstroke: 'Histórico de desidratação ou insolação',
  other: 'Outra',
  none: 'Não possui histórico de nenhuma das situações descritas',
};

export const MED_CATEGORY_LABELS: Record<MedAuthorizationCategory, string> = {
  analgesics: 'Analgésicos e antitérmicos (dor de cabeça, dor muscular, febre, mal-estar)',
  colic: 'Medicamento para cólica (menstrual ou abdominal)',
  nausea: 'Medicamento para náuseas e vômitos',
  mild_allergy: 'Medicamentos para reações alérgicas leves',
  other: 'Outros medicamentos autorizados',
};

export const MED_OPTION_LABELS: Record<string, string> = {
  // analgesics
  paracetamol: 'Paracetamol',
  dipyrone: 'Dipirona',
  ibuprofen: 'Ibuprofeno',
  // colic
  scopolamine: 'Buscopam (escopolamina)',
  // nausea
  metoclopramide: 'Metoclopramida (Plasil)',
  dimenhydrinate: 'Dimenidrato (Dramin)',
  ondansetron: 'Ondansetrona (Vonau)',
  // mild allergy
  loratadine: 'Loratadina',
  cetirizine: 'Cetirizina',
  fexofenadine: 'Fexofenadina',
  // other
  topical_antiseptics: 'Antissépticos tópicos',
  insect_bite_ointment: 'Pomada para picada de inseto',
  diaper_rash_ointment: 'Pomadas para assaduras e irritações leves',
  nasal_saline: 'Soro fisiológico para limpeza nasal',
  lubricant_eye_drops: 'Colírio lubrificante',
  dressings_bandages: 'Curativos e bandagens',
  bruise_gel: 'Gel para contusões',
  // shared
  none_without_prescription: 'Não autorizo administrar nenhum medicamento sem prescrição médica',
  other: 'Outra',
};

// A stable label lookup that falls back to the raw value (used for "Outra: ___" free text).
export function labelOf(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
