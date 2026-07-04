import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@viagem/supabase';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

// Memoized anonymous browser client. The public form never authenticates, so session
// persistence is disabled. Used only for: rpc('get_trip_public'), rpc('submit_traveler') and
// storage.uploadToSignedUrl. The service-role key is never used here.
let client: SupabaseClient<Database> | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
