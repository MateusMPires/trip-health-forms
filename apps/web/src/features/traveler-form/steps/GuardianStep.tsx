'use client';

import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { isMinor } from '@viagem/core';
import { StepShell } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { TextInput } from '@/components/ui/inputs';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CpfInput } from '@/components/ui/CpfInput';
import type { TravelerForm } from '../hooks/useTravelerForm';

const emptyToNull = (v: string) => (v === '' ? null : v);
const GUARDIAN_SENTINEL = 'xx';

export function GuardianStep({ form }: { form: TravelerForm }) {
  const { register, control, setValue, getValues, formState } = form;
  const birthDate = useWatch({ control, name: 'traveler.birth_date' });
  const minor = isMinor(birthDate, new Date());
  const errors = formState.errors.guardians;

  // Adults have no legal guardian: stamp the 'xx' sentinel so the row is unambiguous. Minors get
  // the fields cleared for real input. Only touch the value when it still holds the other mode.
  useEffect(() => {
    const currentName = getValues('guardians.0.full_name');
    if (!minor) {
      if (currentName !== GUARDIAN_SENTINEL) {
        setValue('guardians.0.full_name', GUARDIAN_SENTINEL, { shouldValidate: false });
        setValue('guardians.0.document', GUARDIAN_SENTINEL, { shouldValidate: false });
      }
    } else if (currentName === GUARDIAN_SENTINEL) {
      setValue('guardians.0.full_name', '', { shouldValidate: false });
      setValue('guardians.0.document', '', { shouldValidate: false });
    }
  }, [minor, getValues, setValue]);

  // Guardian fields only exist for minors, so the emergency phones shift from 1/2 to 4/5.
  const phoneBase = minor ? 3 : 0;

  return (
    <StepShell>
      {minor && (
        <>
          <Field
            number={1}
            label="Nome do responsável"
            required
            error={typeof errors?.message === 'string' ? errors.message : errors?.[0]?.full_name?.message}
          >
            <TextInput
              {...register('guardians.0.full_name')}
              placeholder="Nome completo do responsável"
              autoComplete="name"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field number={2} label="CPF do responsável" required error={errors?.[0]?.document?.message}>
              <CpfInput
                control={control}
                name="guardians.0.document"
                invalid={Boolean(errors?.[0]?.document)}
              />
            </Field>
            <Field number={3} label="Parentesco">
              <TextInput
                {...register('guardians.0.relationship', { setValueAs: emptyToNull })}
                placeholder="Ex.: mãe, pai, tio(a)"
              />
            </Field>
          </div>
        </>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          number={phoneBase + 1}
          label="Telefone de emergência"
          required
          error={errors?.[0]?.phone?.message}
        >
          <PhoneInput
            control={control}
            name="guardians.0.phone"
            invalid={Boolean(errors?.[0]?.phone)}
          />
        </Field>
        <Field
          number={phoneBase + 2}
          label="Segundo telefone de emergência"
          required
          error={errors?.[0]?.phone_secondary?.message}
        >
          <PhoneInput
            control={control}
            name="guardians.0.phone_secondary"
            invalid={Boolean(errors?.[0]?.phone_secondary)}
          />
        </Field>
      </div>
    </StepShell>
  );
}
