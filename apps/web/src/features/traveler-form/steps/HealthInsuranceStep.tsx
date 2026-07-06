'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useWatch } from 'react-hook-form';
import { StepShell } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { TextInput } from '@/components/ui/inputs';
import { YesNo } from '@/components/ui/choice';
import { FileUploadField } from '@/features/documents/components/FileUploadField';
import { Reveal } from '@/components/Reveal';
import type { TravelerForm } from '../hooks/useTravelerForm';

const emptyToUndef = (v: string) => (v === '' ? undefined : v);

export function HealthInsuranceStep({ form }: { form: TravelerForm }) {
  const { control, setValue, register, formState } = form;
  const hasInsurance = useWatch({ control, name: 'health.has_health_insurance' });
  const errors = formState.errors.health;
  const insuranceErrors = errors?.data?.insurance;

  return (
    <StepShell>
      <Field
        number={1}
        label="Possui plano de saúde?"
        required
        error={errors?.has_health_insurance?.message}
      >
        <YesNo
          value={hasInsurance ?? null}
          invalid={Boolean(errors?.has_health_insurance)}
          onChange={(v) => setValue('health.has_health_insurance', v, { shouldDirty: true })}
        />
      </Field>

      <AnimatePresence initial={false}>
        {hasInsurance === true && (
          <Reveal keyName="insurance">
            <div className="flex flex-col gap-6">
              <Field label="Operadora" required error={insuranceErrors?.operator?.message}>
                <TextInput
                  {...register('health.data.insurance.operator', { setValueAs: emptyToUndef })}
                  placeholder="Ex.: Unimed"
                  invalid={Boolean(insuranceErrors?.operator)}
                />
              </Field>

              <Field label="Categoria do plano" hint="Ex.: Enfermaria, Apartamento…">
                <TextInput
                  {...register('health.data.insurance.category', { setValueAs: emptyToUndef })}
                  placeholder="Categoria do plano"
                />
              </Field>

              <Field
                label="Número da carteirinha"
                required
                error={insuranceErrors?.card_number?.message}
              >
                <TextInput
                  {...register('health.data.insurance.card_number', { setValueAs: emptyToUndef })}
                  placeholder="Número da carteirinha"
                  invalid={Boolean(insuranceErrors?.card_number)}
                />
              </Field>

              <FileUploadField
                form={form}
                kind="photo"
                label="Foto da carteirinha de saúde"
                hint="Imagem única, até 10 MB."
                required
                error={formState.errors.documents?.message}
              />
            </div>
          </Reveal>
        )}
      </AnimatePresence>
    </StepShell>
  );
}
