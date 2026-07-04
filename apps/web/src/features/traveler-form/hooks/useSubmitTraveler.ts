'use client';

import { useState } from 'react';
import { submitTravelerPayloadSchema } from '@viagem/core';
import type { Json } from '@viagem/supabase';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { isPreview } from '@/lib/preview';
import type { TravelerForm } from './useTravelerForm';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function mapRpcError(message: string): string {
  if (message.includes('invalid access code')) return 'Código da viagem inválido ou expirado.';
  if (message.includes('consent is required')) return 'É necessário aceitar o consentimento LGPD.';
  return 'Não foi possível enviar a ficha. Verifique sua conexão e tente novamente.';
}

// Final validation (belt-and-suspenders over the resolver) + the single atomic submit_traveler RPC.
export function useSubmitTraveler(form: TravelerForm, code: string) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(): Promise<boolean> {
    setStatus('submitting');
    setErrorMessage(null);

    // Stamp the user agent on every consent as light provenance (no IP captured client-side).
    const values = form.getValues();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // Mirror the split insurance fields into the health_insurance anchor text (nurse-scannable
    // column) as "operator · category · number".
    const insurance = values.health?.data?.insurance;
    const composedInsurance =
      values.health?.has_health_insurance === true && insurance
        ? [insurance.operator, insurance.category, insurance.card_number]
            .map((v) => v?.trim())
            .filter(Boolean)
            .join(' · ') || null
        : null;

    const payload = {
      ...values,
      health: values.health
        ? { ...values.health, health_insurance: composedInsurance }
        : values.health,
      consents: (values.consents ?? []).map((c) => ({ ...c, user_agent: userAgent })),
    };

    const parsed = submitTravelerPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      await form.trigger();
      setStatus('error');
      setErrorMessage('Revise os campos obrigatórios antes de enviar.');
      return false;
    }

    // Preview: skip the RPC — the full payload validated, show the success screen.
    if (isPreview()) {
      setStatus('success');
      return true;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.rpc('submit_traveler', {
      p_code: code,
      p_payload: parsed.data as unknown as Json,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(mapRpcError(error.message));
      return false;
    }

    setStatus('success');
    return true;
  }

  return { status, errorMessage, submit };
}
