import type { FieldPath } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import { User, Users, ShieldPlus, HeartPulse, Pill, ClipboardCheck } from 'lucide-react';
import type { SubmitTravelerPayload } from '@viagem/core';
import type { TravelerForm } from '../hooks/useTravelerForm';

import { PersonalDataStep } from './PersonalDataStep';
import { GuardianStep } from './GuardianStep';
import { HealthInsuranceStep } from './HealthInsuranceStep';
import { HealthInfoStep } from './HealthInfoStep';
import { MedicationAuthStep } from './MedicationAuthStep';
import { ConsentReviewStep } from './ConsentReviewStep';
import { validatePersonal, validateInsurance, validateMedicationAuth } from './validation';

export interface StepDef {
  id: string;
  sectionLabel: string;
  // Section header shown at the top of the step (icon + title + description).
  icon: LucideIcon;
  title: string;
  description: string;
  Component: (props: { form: TravelerForm }) => React.ReactNode;
  // Schema-backed fields validated with form.trigger() before advancing (inline errors).
  fields: FieldPath<SubmitTravelerPayload>[];
  // Extra non-schema requirements → returns a banner message or null when complete.
  validate?: (form: TravelerForm) => string | null;
}

export const STEPS: StepDef[] = [
  {
    id: 'personal',
    sectionLabel: 'Dados pessoais',
    icon: User,
    title: 'Dados pessoais',
    description: 'Preencha uma ficha separada para cada adolescente ou missionário.',
    Component: PersonalDataStep,
    fields: [
      'traveler.full_name',
      'traveler.birth_date',
      'traveler.sex',
      'traveler.document',
      'traveler.phone',
      'traveler.email',
    ],
    validate: validatePersonal,
  },
  {
    id: 'guardian',
    sectionLabel: 'Responsável & Contatos',
    icon: Users,
    title: 'Responsável & Contatos de emergência',
    description:
      'Para menores de 18 anos, informe o responsável legal. Em todos os casos, informe os contatos para emergências durante a viagem.',
    Component: GuardianStep,
    fields: ['guardians'],
  },
  {
    id: 'insurance',
    sectionLabel: 'Plano de saúde',
    icon: ShieldPlus,
    title: 'Plano de saúde',
    description: 'Se o adolescente possui plano de saúde, informe os dados da carteirinha.',
    Component: HealthInsuranceStep,
    fields: [
      'health.has_health_insurance',
      'health.data.insurance.operator',
      'health.data.insurance.card_number',
    ],
    validate: validateInsurance,
  },
  {
    id: 'health',
    sectionLabel: 'Informações de saúde',
    icon: HeartPulse,
    title: 'Informações de saúde',
    description:
      'Essas informações serão usadas apenas pela equipe e pela enfermeira que acompanha o grupo.',
    Component: HealthInfoStep,
    // Granular paths so trigger() only gates on this step's questions, not the whole health object.
    fields: [
      'health.has_medical_conditions',
      'health.data.medical_conditions',
      'health.has_allergies',
      'health.data.allergy.type',
      'health.uses_continuous_medication',
      'health.medications',
      'health.needs_medication_on_trip',
      'health.data.medications_to_carry',
      'health.has_physical_limitation',
      'health.physical_limitation_description',
      'health.data.medical_history',
      'health.data.travel_health_history',
      'health.has_dietary_restriction',
      'health.dietary_restrictions',
      'health.blood_type',
    ],
  },
  {
    id: 'medication',
    sectionLabel: 'Autorização de medicamentos',
    icon: Pill,
    title: 'Autorização de medicamentos',
    description:
      'Autorização para administração de medicamentos de uso eventual durante a viagem.',
    Component: MedicationAuthStep,
    fields: [],
    validate: validateMedicationAuth,
  },
  {
    id: 'consent',
    sectionLabel: 'Consentimento & Revisão',
    icon: ClipboardCheck,
    title: 'Consentimento & Revisão',
    description:
      'Confira o resumo, deixe qualquer observação para a equipe de saúde e confirme os consentimentos.',
    Component: ConsentReviewStep,
    fields: ['consents', 'guardians'],
  },
];
