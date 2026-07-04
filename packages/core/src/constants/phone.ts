// Brazilian mobile phone contract, shared by web and mobile. The form only accepts a cell
// number with DDD in the fixed template "(00) 00000-0000" (11 digits: 2 DDD + 9 number).

export const PHONE_CELULAR_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;
export const PHONE_MASK_EXAMPLE = '(11) 91234-5678';
export const PHONE_INVALID_MESSAGE = 'Informe um celular com DDD: (00) 00000-0000';

// Masks a raw input into the "(00) 00000-0000" template. Keeps only digits, caps at 11,
// and formats progressively so it works as an onChange formatter.
export function formatCelular(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
