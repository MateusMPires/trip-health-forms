'use client';

import { useWatch } from 'react-hook-form';
import { isMinor } from '@viagem/core';
import { BLOOD_TYPE_LABELS, labelOf } from '@/lib/format';
import type { TravelerForm } from '../hooks/useTravelerForm';

function yesNo(v: boolean | null | undefined): string {
  if (v === true) return 'Sim';
  if (v === false) return 'Não';
  return '—';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}

// Read-only recap shown before submit. Reads live form values; no sensitive data is logged.
export function ReviewSummary({ form }: { form: TravelerForm }) {
  const values = useWatch({ control: form.control });
  const traveler = values.traveler;
  const minor = isMinor(traveler?.birth_date, new Date());
  const guardian = values.guardians?.[0];
  const documents = values.documents ?? [];

  const fileCount = (kind: string) => documents.filter((d) => d?.kind === kind).length;
  const filesLabel = [
    fileCount('identity_document') ? '1 documento de identidade' : null,
    fileCount('photo') ? '1 carteirinha' : null,
    fileCount('authorization') ? `${fileCount('authorization')} receita(s)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface px-4 py-1">
      <Row label="Nome" value={traveler?.full_name ?? ''} />
      <Row
        label="Nascimento"
        value={traveler?.birth_date ? `${traveler.birth_date}${minor ? ' · menor de 18' : ''}` : ''}
      />
      {minor && <Row label="Responsável" value={guardian?.full_name ?? ''} />}
      <Row
        label="Contatos"
        value={[guardian?.phone, guardian?.phone_secondary].filter(Boolean).join(' · ')}
      />
      <Row
        label="Tipo sanguíneo"
        value={values.health?.blood_type ? labelOf(BLOOD_TYPE_LABELS, values.health.blood_type) : ''}
      />
      <Row label="Plano de saúde" value={yesNo(values.health?.has_health_insurance)} />
      <Row label="Condição médica" value={yesNo(values.health?.has_medical_conditions)} />
      <Row label="Alergias" value={yesNo(values.health?.has_allergies)} />
      <Row label="Uso contínuo de medicação" value={yesNo(values.health?.uses_continuous_medication)} />
      <Row label="Restrição alimentar" value={yesNo(values.health?.has_dietary_restriction)} />
      <Row label="Arquivos" value={filesLabel} />
    </div>
  );
}
