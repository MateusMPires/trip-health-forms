// Pure, RN-free mapping of Supabase auth errors to Portuguese, user-facing
// messages. Kept side-effect-free and framework-free so it is unit-tested
// directly (see tests/auth-errors.test.ts). Never surface raw Supabase strings
// to the leader.
import type { AuthError } from '@supabase/supabase-js';

export type OtpStep = 'request' | 'verify';

// Only the fields we key on — so tests can pass plain objects, not full AuthError.
export type AuthErrorLike = Pick<AuthError, 'code' | 'message' | 'status'>;

export function mapAuthError(error: AuthErrorLike | null, step: OtpStep): string | null {
  if (!error) return null;

  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  const status = error.status ?? 0;

  // Too many emails / verifications in the window (server-side rate limit).
  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    message.includes('rate limit')
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.';
  }

  if (step === 'request') {
    // shouldCreateUser:false + unknown email => signups not allowed for otp.
    if (
      code === 'otp_disabled' ||
      code === 'signup_disabled' ||
      message.includes('signups not allowed') ||
      message.includes('not allowed')
    ) {
      return 'E-mail não cadastrado. Fale com a organização da viagem.';
    }
    return 'Não foi possível enviar o código. Confira o e-mail e tente novamente.';
  }

  // step === 'verify': wrong or expired code.
  if (
    code === 'otp_expired' ||
    status === 403 ||
    message.includes('expired') ||
    message.includes('invalid')
  ) {
    return 'Código inválido ou expirado. Peça um novo código.';
  }
  return 'Não foi possível confirmar o código. Tente novamente.';
}
