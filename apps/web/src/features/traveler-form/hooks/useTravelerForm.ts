'use client';

import { useMemo, useRef } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitTravelerPayloadSchema, type SubmitTravelerPayload } from '@viagem/core';

export type TravelerForm = UseFormReturn<SubmitTravelerPayload>;

// Builds the single React Hook Form instance spanning every step, validated against the composed
// core schema. traveler.id is generated ONCE (kept in a ref) so upload paths and the final insert
// share the same UUID.
export function useTravelerForm(): { form: TravelerForm; travelerId: string } {
  const travelerIdRef = useRef<string | undefined>(undefined);
  if (!travelerIdRef.current) travelerIdRef.current = crypto.randomUUID();
  const travelerId = travelerIdRef.current;

  const defaultValues = useMemo<SubmitTravelerPayload>(
    () => ({
      traveler: {
        id: travelerId,
        full_name: '',
        // Required string fields default to '' (not null) so an empty submit surfaces the
        // friendly "required" message instead of a Zod invalid_type error.
        birth_date: '',
        sex: null,
        document: '',
        phone: '',
        email: null,
        notes: null,
      },
      // One guardian row always exists — it carries the emergency contacts for every traveler.
      // For adults its name/document become the 'xx' sentinel; for minors it's the responsible.
      guardians: [
        {
          full_name: '',
          relationship: null,
          document: null,
          phone: '',
          phone_secondary: '',
          email: null,
        },
      ],
      health: { data: {} },
      consents: [],
      documents: [],
    }),
    [travelerId],
  );

  const form = useForm<SubmitTravelerPayload>({
    resolver: zodResolver(submitTravelerPayloadSchema),
    defaultValues,
    mode: 'onTouched',
    shouldFocusError: true,
  });

  return { form, travelerId };
}
