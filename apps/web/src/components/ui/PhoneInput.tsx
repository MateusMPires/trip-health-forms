'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { formatCelular } from '@viagem/core';
import { TextInput } from './inputs';

// Masked cell-phone input bound to RHF. Stores the already-masked "(00) 00000-0000" string so
// the value matches PHONE_CELULAR_REGEX; formatCelular runs on every keystroke.
export function PhoneInput<T extends FieldValues>({
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
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(00) 00000-0000"
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(e) => field.onChange(formatCelular(e.target.value))}
      onBlur={field.onBlur}
      name={field.name}
      ref={field.ref}
      invalid={invalid}
    />
  );
}
