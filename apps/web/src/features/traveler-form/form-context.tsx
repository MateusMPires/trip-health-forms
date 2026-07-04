'use client';

import { createContext, useContext } from 'react';

// Metadata every step/field needs but that isn't part of the payload: the trip access code and
// the pre-generated traveler id (used so upload paths match the row inserted at submit time).
interface FormMeta {
  code: string;
  travelerId: string;
}

const FormMetaContext = createContext<FormMeta | null>(null);

export function FormMetaProvider({ value, children }: { value: FormMeta; children: React.ReactNode }) {
  return <FormMetaContext.Provider value={value}>{children}</FormMetaContext.Provider>;
}

export function useFormMeta(): FormMeta {
  const ctx = useContext(FormMetaContext);
  if (!ctx) throw new Error('useFormMeta must be used within FormMetaProvider');
  return ctx;
}
