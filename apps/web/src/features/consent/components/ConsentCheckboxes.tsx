'use client';

import { useWatch } from 'react-hook-form';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { upsertConsent, consentValue } from '@/features/consent/consents';
import type { TravelerForm } from '@/features/traveler-form/hooks/useTravelerForm';

const LGPD_TEXT =
  'Autorizo o tratamento dos dados pessoais e de saúde informados nesta ficha, que serão usados ' +
  'exclusivamente pela equipe responsável e pela enfermeira do grupo, com confidencialidade e ' +
  'apenas para o cuidado e a segurança do participante durante a viagem (LGPD).';

const MEDICAL_CARE_TEXT =
  'Declaro que sou o responsável pelo adolescente acima identificado, que as informações fornecidas ' +
  'são verdadeiras e autorizo a equipe responsável pela viagem missionária a buscar atendimento ' +
  'médico, hospitalar e de urgência/emergência caso não seja possível contato imediato comigo.';

function ConsentCard({
  checked,
  onToggle,
  text,
}: {
  checked: boolean;
  onToggle: () => void;
  text: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-left text-sm leading-relaxed transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20',
        checked ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-accent',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong',
        )}
        aria-hidden
      >
        {checked && <Check className="size-3.5" strokeWidth={2.5} />}
      </span>
      <span className="text-foreground">{text}</span>
    </button>
  );
}

// The two required consents (LGPD + medical care). Each toggles a consent row accepted/false.
export function ConsentCheckboxes({ form, error }: { form: TravelerForm; error?: string }) {
  const consents = useWatch({ control: form.control, name: 'consents' });
  const lgpd = consentValue(consents, 'lgpd_terms') === true;
  const medical = consentValue(consents, 'medical_care') === true;

  return (
    <div className="flex flex-col gap-3">
      <ConsentCard checked={lgpd} onToggle={() => upsertConsent(form, 'lgpd_terms', !lgpd)} text={LGPD_TEXT} />
      <ConsentCard
        checked={medical}
        onToggle={() => upsertConsent(form, 'medical_care', !medical)}
        text={MEDICAL_CARE_TEXT}
      />
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
