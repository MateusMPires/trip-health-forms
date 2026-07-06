'use client';

import { MEDICAL_HISTORY_ITEMS } from '@viagem/core';
import { OptionCard } from '@/components/ui/choice';
import { MEDICAL_HISTORY_LABELS } from '@/lib/format';

type HistoryKey = (typeof MEDICAL_HISTORY_ITEMS)[number] | 'none';
export type MedicalHistoryValue = Partial<Record<HistoryKey, boolean>>;

// "Já apresentou alguma das situações abaixo?" — multi-select checklist → health.data.medical_history.
// "Nenhuma" is mutually exclusive with the real situations; at least one option is required.
export function MedicalHistoryGrid({
  value,
  onChange,
  error,
}: {
  value: MedicalHistoryValue;
  onChange: (next: MedicalHistoryValue) => void;
  error?: string;
}) {
  // Selecting a real situation clears "Nenhuma"; selecting "Nenhuma" clears everything else.
  function toggleItem(key: HistoryKey) {
    const selected = value[key] === true;
    onChange({ ...value, [key]: !selected, ...(selected ? {} : { none: false }) });
  }

  function toggleNone() {
    onChange(value.none === true ? { none: false } : { none: true });
  }

  return (
    <div className="flex flex-col gap-2">
      {MEDICAL_HISTORY_ITEMS.map((key) => (
        <OptionCard
          key={key}
          multi
          label={MEDICAL_HISTORY_LABELS[key]}
          selected={value[key] === true}
          onToggle={() => toggleItem(key)}
        />
      ))}
      <OptionCard
        multi
        label={MEDICAL_HISTORY_LABELS.none}
        selected={value.none === true}
        onToggle={toggleNone}
      />
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
