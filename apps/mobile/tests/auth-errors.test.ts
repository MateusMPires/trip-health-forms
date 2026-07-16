import { describe, expect, it } from 'vitest';

import { mapAuthError } from '@/features/auth/errors';

describe('mapAuthError', () => {
  it('returns null when there is no error', () => {
    expect(mapAuthError(null, 'request')).toBeNull();
    expect(mapAuthError(null, 'verify')).toBeNull();
  });

  it('maps an unknown email (signups disabled) to a friendly message on request', () => {
    expect(mapAuthError({ code: 'otp_disabled', message: 'Signups not allowed for otp', status: 422 }, 'request')).toBe(
      'E-mail não cadastrado. Fale com a organização da viagem.',
    );
    expect(mapAuthError({ code: '', message: 'Signups not allowed for otp', status: 422 }, 'request')).toBe(
      'E-mail não cadastrado. Fale com a organização da viagem.',
    );
  });

  it('maps a wrong or expired code to a retry message on verify', () => {
    expect(mapAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid', status: 403 }, 'verify')).toBe(
      'Código inválido ou expirado. Peça um novo código.',
    );
    expect(mapAuthError({ code: '', message: 'Token has expired or is invalid', status: 403 }, 'verify')).toBe(
      'Código inválido ou expirado. Peça um novo código.',
    );
  });

  it('maps rate limiting to a wait message on either step', () => {
    const rateLimited = { code: 'over_email_send_rate_limit', message: 'email rate limit exceeded', status: 429 };
    expect(mapAuthError(rateLimited, 'request')).toBe(
      'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
    );
    expect(mapAuthError(rateLimited, 'verify')).toBe(
      'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
    );
  });

  it('falls back to a generic per-step message for unrecognized errors', () => {
    expect(mapAuthError({ code: '', message: 'network down', status: 500 }, 'request')).toBe(
      'Não foi possível enviar o código. Confira o e-mail e tente novamente.',
    );
    expect(mapAuthError({ code: '', message: 'network down', status: 500 }, 'verify')).toBe(
      'Não foi possível confirmar o código. Tente novamente.',
    );
  });
});
