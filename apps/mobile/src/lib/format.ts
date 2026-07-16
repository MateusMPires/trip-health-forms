// Portuguese labels for the domain values from @viagem/core, plus date helpers.
// Values stay in English (DB contract); only display text is localized here.
import type {
  ConsentKind,
  DocumentKind,
  MedAuthorizationCategory,
  TravelerSex,
  TripStatus,
} from '@viagem/core';

import type { SyncTable } from '@/lib/config';

export const SEX_LABELS: Record<TravelerSex, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not_say: 'Prefere não informar',
};

// Step labels for the sync progress UI (data-download screen after joining a trip).
export const SYNC_TABLE_LABELS: Record<SyncTable, string> = {
  trips: 'Viagens',
  trip_members: 'Equipe da viagem',
  travelers: 'Viajantes',
  guardians: 'Responsáveis',
  health_records: 'Fichas de saúde',
  consents: 'Consentimentos',
  documents: 'Documentos',
};

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  archived: 'Arquivada',
};

export const CONSENT_KIND_LABELS: Record<ConsentKind, string> = {
  lgpd_terms: 'Termos LGPD',
  medical_care: 'Atendimento médico',
  medication_administration: 'Administração de medicamentos',
  self_medication: 'Automedicação',
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  identity_document: 'Documento de identidade',
  authorization: 'Autorização',
  photo: 'Foto',
  commitment_term: 'Termo de Compromisso',
  national_travel_authorization: 'Autorização de Viagem Nacional',
  other: 'Outro',
};

// Section titles mirroring what the public form actually collects under each kind
// (identity photos, health-insurance card photo, prescription files), plus the
// admin-uploaded documents (commitment term, national travel authorization).
export const DOCUMENT_SECTION_LABELS: Record<DocumentKind, string> = {
  identity_document: 'Documento de identidade',
  photo: 'Carteirinha de saúde',
  authorization: 'Receitas médicas',
  commitment_term: 'Termo de Compromisso',
  national_travel_authorization: 'Autorização de Viagem Nacional',
  other: 'Outros',
};

// Blood type options. Real types display verbatim; `unknown` is "Não sabe".
export const BLOOD_TYPE_LABELS: Record<string, string> = {
  unknown: 'Não sabe',
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
  none: 'Nenhuma das situações',
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
  none: 'Sem histórico',
};

export const MED_CATEGORY_LABELS: Record<MedAuthorizationCategory, string> = {
  analgesics: 'Analgésicos e antitérmicos',
  colic: 'Cólica',
  nausea: 'Náuseas e vômitos',
  mild_allergy: 'Reações alérgicas leves',
  other: 'Outros autorizados',
};

export const MED_OPTION_LABELS: Record<string, string> = {
  paracetamol: 'Paracetamol',
  dipyrone: 'Dipirona',
  ibuprofen: 'Ibuprofeno',
  scopolamine: 'Buscopam (escopolamina)',
  metoclopramide: 'Metoclopramida (Plasil)',
  dimenhydrinate: 'Dimenidrato (Dramin)',
  ondansetron: 'Ondansetrona (Vonau)',
  loratadine: 'Loratadina',
  cetirizine: 'Cetirizina',
  fexofenadine: 'Fexofenadina',
  topical_antiseptics: 'Antissépticos tópicos',
  insect_bite_ointment: 'Pomada para picada de inseto',
  diaper_rash_ointment: 'Pomadas para assaduras',
  nasal_saline: 'Soro fisiológico nasal',
  lubricant_eye_drops: 'Colírio lubrificante',
  dressings_bandages: 'Curativos e bandagens',
  bruise_gel: 'Gel para contusões',
  none_without_prescription: 'Nenhum sem prescrição médica',
  other: 'Outra',
};

/** Stable label lookup that falls back to the raw value ("Outra: ___" free text). */
export function labelOf(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

// Brazilian name connectors that stay lowercase mid-name (never at the start).
const NAME_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/**
 * Display-only title case for person names: 'MARIA DA SILVA' → 'Maria da Silva'.
 * Each word gets an uppercase initial and lowercase remainder; PT-BR connectors
 * stay lowercase unless they lead the name. Splits on spaces and hyphens.
 */
export function formatName(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      word
        .split('-')
        .map((part) => {
          const lower = part.toLocaleLowerCase('pt-BR');
          if (index > 0 && NAME_CONNECTORS.has(lower)) return lower;
          return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
        })
        .join('-'),
    )
    .join(' ');
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** '2026-07-04' (or ISO timestamp) → 'Julho de 2026'. Returns null on parse failure. */
export function formatMonthYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${MONTH_NAMES[month - 1]} de ${match[1]}`;
}

/** '2026-07-04' (or ISO timestamp) → '04/07/2026'. Returns the input on parse failure. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** ISO timestamp → '04/07/2026 às 19:42' in device-local time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Full years between a date-only birth date and a reference date. */
export function ageInYears(birthDate: string, reference: Date): number | null {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
