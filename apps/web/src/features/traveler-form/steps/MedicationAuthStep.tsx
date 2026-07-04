'use client';

import { AnimatePresence } from 'motion/react';
import { useWatch } from 'react-hook-form';
import { MED_AUTHORIZATION_OPTIONS, type MedAuthorizationCategory } from '@viagem/core';
import { StepShell } from '@/components/StepShell';
import { Field } from '@/components/ui/Field';
import { YesNo } from '@/components/ui/choice';
import { Reveal } from '@/components/Reveal';
import { MED_CATEGORY_LABELS, MED_OPTION_LABELS, labelOf } from '@/lib/format';
import { ChecklistField } from '@/features/health-info/components/ChecklistField';
import { upsertConsent, consentValue } from '@/features/consent/consents';
import type { TravelerForm } from '../hooks/useTravelerForm';

const CATEGORIES = Object.keys(MED_AUTHORIZATION_OPTIONS) as MedAuthorizationCategory[];

export function MedicationAuthStep({ form }: { form: TravelerForm }) {
  const { control, setValue } = form;
  const consents = useWatch({ control, name: 'consents' });
  const medAuths = useWatch({ control, name: 'health.data.med_authorizations' }) ?? {};

  const canAdminister = consentValue(consents, 'medication_administration');
  const selfMed = consentValue(consents, 'self_medication');

  return (
    <StepShell
      title="Autorização de medicamentos"
      description="Autorização para administração de medicamentos de uso eventual durante a viagem."
    >
      <Field
        label="Autorizo a enfermeira responsável e/ou equipe designada a administrar medicamentos de uso eventual, respeitando as orientações do fabricante, faixa etária e avaliação clínica, caso necessário durante a viagem."
        required
      >
        <YesNo
          value={canAdminister}
          onChange={(v) => upsertConsent(form, 'medication_administration', v)}
        />
      </Field>

      <AnimatePresence initial={false}>
        {canAdminister === true && (
          <Reveal keyName="med-categories">
            <div className="flex flex-col gap-6">
              {CATEGORIES.map((cat) => (
                <Field key={cat} label={MED_CATEGORY_LABELS[cat]}>
                  <ChecklistField
                    options={MED_AUTHORIZATION_OPTIONS[cat].map((opt) => ({
                      value: opt,
                      label: labelOf(MED_OPTION_LABELS, opt),
                    }))}
                    value={medAuths[cat] ?? []}
                    onChange={(next) =>
                      setValue(`health.data.med_authorizations.${cat}`, next, { shouldDirty: true })
                    }
                  />
                </Field>
              ))}
            </div>
          </Reveal>
        )}
      </AnimatePresence>

      <Field
        label="Caso o adolescente utilize medicamentos de uso contínuo ou esteja em tratamento, você autoriza que ele seja responsável por tomar seus medicamentos nos horários corretos, conforme orientação médica?"
        hint="Caso não autorize, a equipe entrará em contato para definir a melhor forma de acompanhamento durante a viagem."
        required
      >
        <YesNo value={selfMed} onChange={(v) => upsertConsent(form, 'self_medication', v)} />
      </Field>
    </StepShell>
  );
}
