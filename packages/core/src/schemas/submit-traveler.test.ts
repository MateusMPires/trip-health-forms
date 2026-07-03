import { describe, it, expect } from 'vitest';
import { submitTravelerPayloadSchema } from './submit-traveler';

// A complete, valid minor submission mirroring the "FICHA DE SAÚDE" form.
function validMinorPayload() {
  return {
    traveler: {
      full_name: 'Fulano Adolescente',
      birth_date: '2012-05-01',
      sex: 'male',
      document: '111.111.111-11',
      phone: '11999990000',
      email: 'resp@example.com',
    },
    guardians: [
      {
        full_name: 'Responsavel Sobrenome',
        relationship: 'mother',
        document: '222.222.222-22',
        phone: '11988887777',
        phone_secondary: '11977776666',
        email: 'resp@example.com',
      },
    ],
    health: {
      health_insurance: 'Unimed / Basic / 123',
      medications: 'Ritalina',
      dietary_restrictions: 'none',
      notes: 'info for the health team',
      has_health_insurance: true,
      has_medical_conditions: true,
      has_allergies: true,
      uses_continuous_medication: true,
      needs_medication_on_trip: true,
      has_physical_limitation: false,
      data: {
        medical_conditions: ['asthma', 'adhd'],
        allergy: { type: 'food', reaction: 'hives', seafood: 'shrimp' },
        medications_to_carry: 'inhaler',
        medical_history: { asthma_attack: true, seizure: false },
        travel_health_history: ['motion_sickness', 'heat_sensitivity'],
        med_authorizations: { analgesics: ['paracetamol', 'dipyrone'], colic: ['scopolamine'] },
      },
    },
    consents: [
      { kind: 'lgpd_terms', accepted: true, terms_version: 'v1' },
      { kind: 'medical_care', accepted: true, terms_version: 'v1' },
      { kind: 'medication_administration', accepted: true, terms_version: 'v1' },
      { kind: 'self_medication', accepted: false, terms_version: 'v1' },
    ],
    documents: [
      {
        kind: 'identity_document',
        storage_path: 'org/trip/trav/identity_document/uuid-doc.jpg',
        file_name: 'doc.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 12345,
      },
    ],
  };
}

describe('submitTravelerPayloadSchema', () => {
  it('parses a complete valid minor submission', () => {
    const parsed = submitTravelerPayloadSchema.parse(validMinorPayload());
    expect(parsed.traveler.full_name).toBe('Fulano Adolescente');
    expect(parsed.consents).toHaveLength(4);
    expect(parsed.health?.data.medical_conditions).toEqual(['asthma', 'adhd']);
  });

  it('applies defaults for documents kind/bucket and empty arrays', () => {
    const parsed = submitTravelerPayloadSchema.parse({
      traveler: { full_name: 'Adulto Missionario', document: '333' },
      consents: [
        { kind: 'lgpd_terms', accepted: true, terms_version: 'v1' },
        { kind: 'medical_care', accepted: true, terms_version: 'v1' },
      ],
    });
    expect(parsed.guardians).toEqual([]);
    expect(parsed.documents).toEqual([]);
  });

  it('rejects a submission missing the LGPD consent', () => {
    const payload = validMinorPayload();
    payload.consents = payload.consents.filter((c) => c.kind !== 'lgpd_terms');
    const result = submitTravelerPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects a minor without a responsible guardian', () => {
    const payload = validMinorPayload();
    payload.guardians = [
      { full_name: 'xx', relationship: null, document: 'xx', phone: null, phone_secondary: null, email: null } as never,
    ];
    const result = submitTravelerPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('accepts an adult (over 18) with no responsible guardian', () => {
    const payload = validMinorPayload();
    payload.traveler.birth_date = '1990-01-01';
    payload.guardians = [];
    const result = submitTravelerPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
