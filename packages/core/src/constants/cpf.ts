// CPF contract, shared by web and mobile. The form masks CPF to "000.000.000-00" and rejects
// numbers that fail the check-digit algorithm (a "correct" CPF, not just the right length).

export const CPF_INVALID_MESSAGE = 'Informe um CPF válido';

// Masks a raw input into the "000.000.000-00" template (progressive, works as an onChange formatter).
export function formatCPF(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Validates a CPF by its two check digits. Rejects wrong length and all-equal-digit sequences
// (e.g. 111.111.111-11), which pass the checksum but are not real CPFs.
export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}
