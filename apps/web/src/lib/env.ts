// Public Supabase env vars. NEXT_PUBLIC_* are inlined at build time and safe on the client;
// the service-role key is never read here (it lives only in the Edge Function). Accessed lazily
// (via functions) so a missing var throws only when actually used at runtime — not at import,
// which would break the build/prerender.
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in apps/web/.env.local (see .env.example).`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
