import { describe, expect, it } from 'vitest';

import { travelerAlerts } from '@/features/travelers/alerts';

const clean = { denied_consent_kinds: null, has_allergies: 0, has_dietary_restriction: 0 };

describe('travelerAlerts', () => {
  it('returns null when there is nothing to flag', () => {
    expect(travelerAlerts(clean, false)).toBeNull();
  });

  it('names each denied authorization as a warning', () => {
    expect(travelerAlerts({ ...clean, denied_consent_kinds: 'self_medication' }, false)).toEqual({
      warning: 'Não autorizou: Automedicação',
      info: null,
    });
  });

  it('sorts denied kinds canonically and ignores unknown values', () => {
    expect(
      travelerAlerts(
        { ...clean, denied_consent_kinds: 'self_medication,bogus,medication_administration' },
        false,
      ),
    ).toEqual({
      warning: 'Não autorizou: Administração de medicamentos, Automedicação',
      info: null,
    });
  });

  it('flags allergies and dietary restriction as warnings, minor as info', () => {
    expect(
      travelerAlerts({ ...clean, has_allergies: 1, has_dietary_restriction: 1 }, true),
    ).toEqual({
      warning: 'Alergias · Restrição alimentar',
      info: 'Menor de idade',
    });
  });

  it('reports a minor with no health/consent flags as info only', () => {
    expect(travelerAlerts(clean, true)).toEqual({ warning: null, info: 'Menor de idade' });
  });

  it('treats missing health record (null flags) as nothing to flag', () => {
    expect(
      travelerAlerts(
        { denied_consent_kinds: null, has_allergies: null, has_dietary_restriction: null },
        false,
      ),
    ).toBeNull();
  });

  it('puts denied authorizations before the other warnings', () => {
    expect(
      travelerAlerts({ ...clean, denied_consent_kinds: 'medical_care', has_allergies: 1 }, true),
    ).toEqual({
      warning: 'Não autorizou: Atendimento médico · Alergias',
      info: 'Menor de idade',
    });
  });
});
