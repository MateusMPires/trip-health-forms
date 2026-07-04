'use client';

import { AnimatePresence } from 'motion/react';
import { useWatch } from 'react-hook-form';
import { MEDICAL_CONDITIONS, ALLERGY_TYPES, TRAVEL_HEALTH_HISTORY, BLOOD_TYPES } from '@viagem/core';
import { MAX_PRESCRIPTION_FILES } from '@/lib/config';
import { StepShell, FieldGroup } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { TextInput, TextArea, Select } from '@/components/ui/inputs';
import { YesNo, OptionCard } from '@/components/ui/choice';
import { Reveal } from '@/components/Reveal';
import {
  MEDICAL_CONDITION_LABELS,
  ALLERGY_TYPE_LABELS,
  TRAVEL_HEALTH_HISTORY_LABELS,
  BLOOD_TYPE_LABELS,
  labelOf,
} from '@/lib/format';
import { ChecklistField } from '@/features/health-info/components/ChecklistField';
import { MedicalHistoryGrid } from '@/features/health-info/components/MedicalHistoryGrid';
import { FileUploadField } from '@/features/documents/components/FileUploadField';
import type { TravelerForm } from '../hooks/useTravelerForm';

const emptyToNull = (v: string) => (v === '' ? null : v);
const emptyToUndef = (v: string) => (v === '' ? undefined : v);

const KNOWN_ALLERGY_TYPES = new Set<string>(ALLERGY_TYPES.filter((t) => t !== 'other'));

export function HealthInfoStep({ form }: { form: TravelerForm }) {
  const { control, register, setValue, formState } = form;
  const errors = formState.errors.health;

  const hasConditions = useWatch({ control, name: 'health.has_medical_conditions' });
  const hasAllergies = useWatch({ control, name: 'health.has_allergies' });
  const usesContinuous = useWatch({ control, name: 'health.uses_continuous_medication' });
  const needsOnTrip = useWatch({ control, name: 'health.needs_medication_on_trip' });
  const hasLimitation = useWatch({ control, name: 'health.has_physical_limitation' });
  const hasDietary = useWatch({ control, name: 'health.has_dietary_restriction' });

  const conditions = useWatch({ control, name: 'health.data.medical_conditions' }) ?? [];
  const travelHistory = useWatch({ control, name: 'health.data.travel_health_history' }) ?? [];
  const medicalHistory = useWatch({ control, name: 'health.data.medical_history' }) ?? {};
  const allergyType = useWatch({ control, name: 'health.data.allergy.type' }) ?? '';

  const allergyRadio = KNOWN_ALLERGY_TYPES.has(allergyType)
    ? allergyType
    : allergyType
      ? 'other'
      : '';

  return (
    <StepShell
      title="Informações de saúde"
      description="Essas informações serão usadas apenas pela equipe e pela enfermeira que acompanha o grupo."
    >
      {/* Medical conditions */}
      <Field
        label="Possui alguma doença ou condição médica?"
        required
        error={errors?.has_medical_conditions?.message}
      >
        <YesNo
          value={hasConditions ?? null}
          invalid={Boolean(errors?.has_medical_conditions)}
          onChange={(v) => setValue('health.has_medical_conditions', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {hasConditions === true && (
          <Reveal keyName="conditions">
            <Field label="Quais condições?" error={errors?.data?.medical_conditions?.message}>
              <ChecklistField
                options={MEDICAL_CONDITIONS.map((c) => ({
                  value: c,
                  label: labelOf(MEDICAL_CONDITION_LABELS, c),
                }))}
                value={conditions}
                onChange={(next) =>
                  setValue('health.data.medical_conditions', next, { shouldDirty: true })
                }
              />
            </Field>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Allergies */}
      <Field label="Possui alguma alergia?" required error={errors?.has_allergies?.message}>
        <YesNo
          value={hasAllergies ?? null}
          invalid={Boolean(errors?.has_allergies)}
          onChange={(v) => setValue('health.has_allergies', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {hasAllergies === true && (
          <Reveal keyName="allergies">
            <div className="flex flex-col gap-6">
              <Field label="Qual tipo de alergia?" required error={errors?.data?.allergy?.type?.message}>
                <div className="flex flex-col gap-2">
                  {ALLERGY_TYPES.map((t) => (
                    <OptionCard
                      key={t}
                      label={labelOf(ALLERGY_TYPE_LABELS, t)}
                      selected={allergyRadio === t}
                      onToggle={() =>
                        setValue('health.data.allergy.type', t === 'other' ? '' : t, {
                          shouldDirty: true,
                        })
                      }
                    />
                  ))}
                  {allergyRadio === 'other' && (
                    <TextInput
                      value={KNOWN_ALLERGY_TYPES.has(allergyType) ? '' : allergyType}
                      onChange={(e) =>
                        setValue('health.data.allergy.type', e.target.value, { shouldDirty: true })
                      }
                      placeholder="Especifique o tipo de alergia"
                    />
                  )}
                </div>
              </Field>
              <Field label="Que reação apresenta durante quadros de alergia?">
                <TextInput
                  {...register('health.data.allergy.reaction', { setValueAs: emptyToUndef })}
                  placeholder="Descreva a reação"
                />
              </Field>
              <Field
                label="Tem alergia a frutos do mar? Quais?"
                hint="A região é litorânea e possivelmente teremos alimentos da região."
              >
                <TextInput
                  {...register('health.data.allergy.seafood', { setValueAs: emptyToUndef })}
                  placeholder="Ex.: camarão, siri…"
                />
              </Field>
            </div>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Continuous medication */}
      <Field
        label="Faz uso contínuo de medicamentos?"
        required
        error={errors?.uses_continuous_medication?.message}
      >
        <YesNo
          value={usesContinuous ?? null}
          invalid={Boolean(errors?.uses_continuous_medication)}
          onChange={(v) => setValue('health.uses_continuous_medication', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {usesContinuous === true && (
          <Reveal keyName="continuous">
            <div className="flex flex-col gap-6">
              <Field label="Quais medicamentos de uso contínuo?" error={errors?.medications?.message}>
                <TextInput
                  {...register('health.medications', { setValueAs: emptyToNull })}
                  placeholder="Liste os medicamentos"
                  invalid={Boolean(errors?.medications)}
                />
              </Field>
              <FileUploadField
                form={form}
                kind="authorization"
                label="Receita(s) médica(s) mais recente(s)"
                hint={`Envie a receita dos medicamentos de uso contínuo. PDF, até ${MAX_PRESCRIPTION_FILES} arquivos de 10 MB.`}
                maxFiles={MAX_PRESCRIPTION_FILES}
              />
            </div>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Medication to carry */}
      <Field
        label="Necessita portar medicamentos durante a viagem?"
        required
        error={errors?.needs_medication_on_trip?.message}
      >
        <YesNo
          value={needsOnTrip ?? null}
          invalid={Boolean(errors?.needs_medication_on_trip)}
          onChange={(v) => setValue('health.needs_medication_on_trip', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {needsOnTrip === true && (
          <Reveal keyName="carry">
            <Field
              label="Quais medicamentos precisará portar?"
              error={errors?.data?.medications_to_carry?.message}
            >
              <TextInput
                {...register('health.data.medications_to_carry', { setValueAs: emptyToUndef })}
                placeholder="Liste os medicamentos"
                invalid={Boolean(errors?.data?.medications_to_carry)}
              />
            </Field>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Physical limitation */}
      <Field
        label="Possui alguma limitação física ou necessidade especial?"
        required
        error={errors?.has_physical_limitation?.message}
      >
        <YesNo
          value={hasLimitation ?? null}
          invalid={Boolean(errors?.has_physical_limitation)}
          onChange={(v) => setValue('health.has_physical_limitation', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {hasLimitation === true && (
          <Reveal keyName="limitation">
            <Field
              label="Descreva a limitação física ou necessidade especial"
              error={errors?.physical_limitation_description?.message}
            >
              <TextArea
                {...register('health.physical_limitation_description', { setValueAs: emptyToNull })}
                placeholder="Descreva abaixo"
                invalid={Boolean(errors?.physical_limitation_description)}
              />
            </Field>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Medical history grid */}
      <FieldGroup legend="Já apresentou alguma das situações abaixo?">
        <MedicalHistoryGrid
          value={medicalHistory}
          onChange={(next) => setValue('health.data.medical_history', next, { shouldDirty: true })}
        />
        <Field label="Caso tenha assinalado “Sim”, explique brevemente.">
          <TextArea
            {...register('health.data.medical_history_notes', { setValueAs: emptyToUndef })}
            placeholder="Sua resposta"
          />
        </Field>
      </FieldGroup>

      {/* Travel health history */}
      <Field label="Assinale se o adolescente possui histórico de:">
        <ChecklistField
          options={TRAVEL_HEALTH_HISTORY.map((h) => ({
            value: h,
            label: labelOf(TRAVEL_HEALTH_HISTORY_LABELS, h),
          }))}
          value={travelHistory}
          onChange={(next) =>
            setValue('health.data.travel_health_history', next, { shouldDirty: true })
          }
        />
      </Field>

      {/* Dietary restriction */}
      <Field
        label="Possui alguma restrição alimentar?"
        required
        error={errors?.has_dietary_restriction?.message}
      >
        <YesNo
          value={hasDietary ?? null}
          invalid={Boolean(errors?.has_dietary_restriction)}
          onChange={(v) => setValue('health.has_dietary_restriction', v, { shouldDirty: true })}
        />
      </Field>
      <AnimatePresence initial={false}>
        {hasDietary === true && (
          <Reveal keyName="dietary">
            <Field label="Qual restrição alimentar?" error={errors?.dietary_restrictions?.message}>
              <TextInput
                {...register('health.dietary_restrictions', { setValueAs: emptyToNull })}
                placeholder="Ex.: sem lactose, vegetariano…"
                invalid={Boolean(errors?.dietary_restrictions)}
              />
            </Field>
          </Reveal>
        )}
      </AnimatePresence>

      {/* Blood type */}
      <Field label="Tipo sanguíneo" required error={errors?.blood_type?.message}>
        <Select
          {...register('health.blood_type')}
          defaultValue=""
          invalid={Boolean(errors?.blood_type)}
        >
          <option value="">Selecione…</option>
          {BLOOD_TYPES.map((b) => (
            <option key={b} value={b}>
              {labelOf(BLOOD_TYPE_LABELS, b)}
            </option>
          ))}
        </Select>
      </Field>
    </StepShell>
  );
}
