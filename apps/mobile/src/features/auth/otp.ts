// Pure, RN-free helpers for the OTP code field. Unit-tested (tests/auth-otp.test.ts).
import { OTP_CODE_LENGTH } from '@/lib/config';

// Keep only digits and cap the length — paste/autofill may include spaces or a link.
export function sanitizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH);
}

// A complete, submittable code: exactly OTP_CODE_LENGTH digits.
export function isCompleteOtpCode(code: string): boolean {
  return code.length === OTP_CODE_LENGTH && /^\d+$/.test(code);
}
