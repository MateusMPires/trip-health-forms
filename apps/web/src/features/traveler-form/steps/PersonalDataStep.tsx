'use client';

import { TRAVELER_SEX } from '@viagem/core';
import { StepShell } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { TextInput, Select } from '@/components/ui/inputs';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CpfInput } from '@/components/ui/CpfInput';
import { SEX_LABELS } from '@/lib/format';
import { FileUploadField } from '@/features/documents/components/FileUploadField';
import type { TravelerForm } from '../hooks/useTravelerForm';

const emptyToNull = (v: string) => (v === '' ? null : v);

export function PersonalDataStep({ form }: { form: TravelerForm }) {
  const { register, control, formState } = form;
  const errors = formState.errors.traveler;

  return (
    <StepShell
      title="Dados pessoais"
      description="Preencha uma ficha separada para cada adolescente ou missionário."
    >
      <Field label="Nome do adolescente / missionário" required error={errors?.full_name?.message}>
        <TextInput
          {...register('traveler.full_name')}
          placeholder="Nome completo"
          autoComplete="name"
          invalid={Boolean(errors?.full_name)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Data de nascimento" required error={errors?.birth_date?.message}>
          <TextInput
            type="date"
            {...register('traveler.birth_date')}
            invalid={Boolean(errors?.birth_date)}
          />
        </Field>

        <Field label="Sexo" required error={errors?.sex?.message}>
          <Select
            {...register('traveler.sex')}
            defaultValue=""
            invalid={Boolean(errors?.sex)}
          >
            <option value="">Selecione…</option>
            {TRAVELER_SEX.map((s) => (
              <option key={s} value={s}>
                {SEX_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="CPF do adolescente / missionário" required error={errors?.document?.message}>
        <CpfInput control={control} name="traveler.document" invalid={Boolean(errors?.document)} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Telefone" required error={errors?.phone?.message}>
          <PhoneInput control={control} name="traveler.phone" invalid={Boolean(errors?.phone)} />
        </Field>
        <Field label="E-mail" error={errors?.email?.message}>
          <TextInput
            type="email"
            {...register('traveler.email', { setValueAs: emptyToNull })}
            placeholder="email@exemplo.com"
            autoComplete="email"
            invalid={Boolean(errors?.email)}
          />
        </Field>
      </div>

      <FileUploadField
        form={form}
        kind="identity_document"
        label="Foto do documento de identidade"
        hint="Envie uma foto legível do RG ou documento com foto. Imagem única, até 10 MB."
        required
        error={formState.errors.documents?.message}
      />
    </StepShell>
  );
}
