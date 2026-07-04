import type { FieldPath } from 'react-hook-form';
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
    sectionLabel: 'Responsável & contatos',
    Component: GuardianStep,
    fields: ['guardians'],
  },
  {
    id: 'insurance',
    sectionLabel: 'Plano de saúde',
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
      'health.has_dietary_restriction',
      'health.dietary_restrictions',
      'health.blood_type',
    ],
  },
  {
    id: 'medication',
    sectionLabel: 'Autorização de medicamentos',
    Component: MedicationAuthStep,
    fields: [],
    validate: validateMedicationAuth,
  },
  {
    id: 'consent',
    sectionLabel: 'Consentimento & revisão',
    Component: ConsentReviewStep,
    fields: ['consents', 'guardians'],
  },
];
