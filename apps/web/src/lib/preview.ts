// Preview mode — lets you see and click through the whole form with just `pnpm dev`, no Supabase
// and no Docker. Enabled by NEXT_PUBLIC_PREVIEW=1. In this mode the trip code isn't validated,
// uploads are compressed but not sent, and submit just shows the success screen. NEVER enable in
// production: it bypasses the real backend.
export function isPreview(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEW === '1';
}
