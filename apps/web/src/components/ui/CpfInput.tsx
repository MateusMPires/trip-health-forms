'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { formatCPF } from '@viagem/core';
import { TextInput } from './inputs';

// Masked CPF input bound to RHF. Stores the masked "000.000.000-00" string; formatCPF runs on
// every keystroke and the schema validates the check digits.
export function CpfInput<T extends FieldValues>({
  control,
  name,
  invalid,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  invalid?: boolean;
}) {
  const { field } = useController({ control, name });

  return (
    <TextInput
      inputMode="numeric"
      placeholder="000.000.000-00"
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(e) => field.onChange(formatCPF(e.target.value))}
      onBlur={field.onBlur}
      name={field.name}
      ref={field.ref}
      invalid={invalid}
    />
  );
}
