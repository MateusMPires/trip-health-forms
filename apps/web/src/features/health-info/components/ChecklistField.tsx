'use client';

import { useMemo, useState } from 'react';
import { OptionCard } from '@/components/ui/choice';
import { TextInput } from '@/components/ui/inputs';

export interface ChecklistOption {
  value: string;
  label: string;
}

// Multi-select checklist backed by a string[]. Known tokens (e.g. 'asthma') are stored as-is; the
// "Outra" option reveals a free-text box whose verbatim text is stored as an extra array element
// (per healthDataSchema, which keeps free answers verbatim rather than a strict enum). An optional
// `noneValue` adds a mutually-exclusive "none of the above" option.
export function ChecklistField({
  options,
  value,
  onChange,
  otherValue = 'other',
  otherLabel = 'Outra',
  otherPlaceholder = 'Especifique',
  noneValue,
  noneLabel,
}: {
  options: readonly ChecklistOption[];
  value: string[];
  onChange: (next: string[]) => void;
  otherValue?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  noneValue?: string;
  noneLabel?: string;
}) {
  const knownValues = useMemo(
    () => new Set(options.filter((o) => o.value !== otherValue).map((o) => o.value)),
    [options, otherValue],
  );

  // The free-text "Outra" answer is the only element that is neither a known token nor "none".
  const isReserved = (v: string) => knownValues.has(v) || v === noneValue;
  const selectedKnown = value.filter((v) => knownValues.has(v));
  const freeText = value.find((v) => !isReserved(v)) ?? '';
  const noneSelected = noneValue != null && value.includes(noneValue);

  const [otherOpen, setOtherOpen] = useState(freeText.length > 0);
  const [otherText, setOtherText] = useState(freeText);

  const hasOther = options.some((o) => o.value === otherValue);

  function emit(nextKnown: string[], nextOtherOpen: boolean, nextOtherText: string, none: boolean) {
    const trimmed = nextOtherText.trim();
    onChange([
      ...nextKnown,
      ...(nextOtherOpen && trimmed ? [trimmed] : []),
      ...(none && noneValue != null ? [noneValue] : []),
    ]);
  }

  // Selecting any real option clears "none"; selecting "none" clears everything else.
  function toggleKnown(v: string) {
    const next = selectedKnown.includes(v)
      ? selectedKnown.filter((x) => x !== v)
      : [...selectedKnown, v];
    emit(next, otherOpen, otherText, false);
  }

  function toggleOther() {
    const next = !otherOpen;
    setOtherOpen(next);
    emit(selectedKnown, next, otherText, false);
  }

  function changeOtherText(text: string) {
    setOtherText(text);
    emit(selectedKnown, true, text, false);
  }

  function toggleNone() {
    const next = !noneSelected;
    if (next) setOtherOpen(false);
    emit(next ? [] : selectedKnown, next ? false : otherOpen, otherText, next);
  }

  return (
    <div className="flex flex-col gap-2">
      {options
        .filter((o) => o.value !== otherValue)
        .map((o) => (
          <OptionCard
            key={o.value}
            multi
            label={o.label}
            selected={selectedKnown.includes(o.value)}
            onToggle={() => toggleKnown(o.value)}
          />
        ))}
      {hasOther && (
        <>
          <OptionCard multi label={otherLabel} selected={otherOpen} onToggle={toggleOther} />
          {otherOpen && (
            <TextInput
              value={otherText}
              onChange={(e) => changeOtherText(e.target.value)}
              placeholder={otherPlaceholder}
              autoFocus
            />
          )}
        </>
      )}
      {noneValue != null && noneLabel != null && (
        <OptionCard multi label={noneLabel} selected={noneSelected} onToggle={toggleNone} />
      )}
    </div>
  );
}
