// Public Supabase env vars. EXPO_PUBLIC_* are inlined at build time and safe on the
// client (anon key only — the service-role key must never reach the app). Accessed
// lazily so a missing var throws when used, with a message pointing at .env.
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in apps/mobile/.env (see .env.example).`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}
