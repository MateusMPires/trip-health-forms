'use client';

import { MEDICAL_HISTORY_ITEMS } from '@viagem/core';
import { YesNo } from '@/components/ui/choice';
import { MEDICAL_HISTORY_LABELS } from '@/lib/format';

type HistoryKey = (typeof MEDICAL_HISTORY_ITEMS)[number];
export type MedicalHistoryValue = Partial<Record<HistoryKey, boolean>>;

// The "Já apresentou alguma das situações abaixo?" Sim/Não grid → health.data.medical_history.
export function MedicalHistoryGrid({
  value,
  onChange,
}: {
  value: MedicalHistoryValue;
  onChange: (next: MedicalHistoryValue) => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {MEDICAL_HISTORY_ITEMS.map((key) => (
        <div key={key} className="flex items-center justify-between gap-4 bg-surface px-4 py-3">
          <span className="text-sm text-foreground">{MEDICAL_HISTORY_LABELS[key]}</span>
          <div className="w-40 shrink-0">
            <YesNo
              value={value[key] ?? null}
              onChange={(v) => onChange({ ...value, [key]: v })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
