import { getSupabaseBrowserClient } from './supabase-browser';
import { isPreview } from './preview';

export type TripLookup =
  | { status: 'found'; name: string }
  | { status: 'not_found' }
  | { status: 'error' };

// Validates the access code against the anon-only get_trip_public RPC and returns the trip name
// for the landing screen. The public form can't SELECT trips, so this is the only read path —
// and it deliberately returns nothing but the name (no org/trip id).
export async function getTripPublic(code: string): Promise<TripLookup> {
  // Preview: skip validation entirely so the form renders with just `pnpm dev`.
  if (isPreview()) return { status: 'found', name: 'Viagem de Teste (preview)' };

  // Any thrown/rejected path (missing env, network hang, RPC failure) must resolve to a terminal
  // state — otherwise the landing screen is stuck on "Validando…" forever.
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('get_trip_public', { p_code: code });

    if (error) return { status: 'error' };
    if (!data) return { status: 'not_found' };
    return { status: 'found', name: data };
  } catch {
    return { status: 'error' };
  }
}
