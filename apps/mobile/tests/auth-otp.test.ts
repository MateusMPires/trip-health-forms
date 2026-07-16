import { describe, expect, it } from 'vitest';

import { isCompleteOtpCode, sanitizeOtpInput } from '@/features/auth/otp';
import { OTP_CODE_LENGTH } from '@/lib/config';

const fullCode = '1'.repeat(OTP_CODE_LENGTH);

describe('sanitizeOtpInput', () => {
  it('strips non-digits and caps at the code length', () => {
    expect(sanitizeOtpInput('12-34 56')).toBe('123456'.slice(0, OTP_CODE_LENGTH));
    expect(sanitizeOtpInput('abc123def456ghi')).toBe('123456'.slice(0, OTP_CODE_LENGTH));
    expect(sanitizeOtpInput('9'.repeat(OTP_CODE_LENGTH + 4))).toHaveLength(OTP_CODE_LENGTH);
  });
});

describe('isCompleteOtpCode', () => {
  it('accepts exactly OTP_CODE_LENGTH digits', () => {
    expect(isCompleteOtpCode(fullCode)).toBe(true);
  });

  it('rejects empty, short, long, or non-numeric input', () => {
    expect(isCompleteOtpCode('')).toBe(false);
    expect(isCompleteOtpCode('123')).toBe(false);
    expect(isCompleteOtpCode(fullCode + '1')).toBe(false);
    expect(isCompleteOtpCode('12a45b')).toBe(false);
  });
});
