'use client';

import { StepShell, FieldGroup } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { TextArea } from '@/components/ui/inputs';
import { ConsentCheckboxes } from '@/features/consent/components/ConsentCheckboxes';
import { ReviewSummary } from '../components/ReviewSummary';
import type { TravelerForm } from '../hooks/useTravelerForm';

const emptyToNull = (v: string) => (v === '' ? null : v);

export function ConsentReviewStep({ form }: { form: TravelerForm }) {
  const { register, formState } = form;

  return (
    <StepShell
      title="Consentimento e revisão"
      description="Confira o resumo, deixe qualquer observação para a equipe de saúde e confirme os consentimentos."
    >
      <Field
        label="Existe alguma informação que a equipe de saúde deva conhecer para garantir a segurança do adolescente?"
      >
        <TextArea
          {...register('health.notes', { setValueAs: emptyToNull })}
          placeholder="Sua resposta"
        />
      </Field>

      <FieldGroup legend="Resumo da ficha">
        <ReviewSummary form={form} />
      </FieldGroup>

      <FieldGroup legend="Consentimentos obrigatórios">
        <ConsentCheckboxes
          form={form}
          error={typeof formState.errors.consents?.message === 'string' ? formState.errors.consents.message : undefined}
        />
      </FieldGroup>
    </StepShell>
  );
}
