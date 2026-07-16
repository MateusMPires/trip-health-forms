// The single write this app is allowed to make: joining a trip by access code
// (RPC join_trip). Everything else is read-only against the RLS-scoped tables.
import { JOIN_TRIP_TIMEOUT_MS } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export async function joinTrip(code: string): Promise<{ error: string | null }> {
  // Abort instead of hanging forever on a dead connection — the screen offers retry.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JOIN_TRIP_TIMEOUT_MS);
  try {
    const { error } = await supabase
      .rpc('join_trip', { p_code: code.trim() })
      .abortSignal(controller.signal);
    if (error) {
      return {
        error:
          error.message === 'invalid access code'
            ? 'Código inválido. Confira com o organizador da viagem.'
            : 'Não foi possível entrar na viagem. Verifique sua conexão.',
      };
    }
    return { error: null };
  } catch {
    // Aborted (timeout) or network failure before a response.
    return { error: 'Não foi possível entrar na viagem. Verifique sua conexão.' };
  } finally {
    clearTimeout(timeout);
  }
}
