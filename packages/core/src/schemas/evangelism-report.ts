import { z } from 'zod';

// Mirrors public.evangelism_reports — daily evangelism counters a group leader files
// per trip day. report_date is the day being reported (distinct from created_at);
// the window check (report_date within the trip's dates) lives in the UI + a DB
// trigger, since @viagem/core does not know the trip's dates.
//
// The six counters model the evangelism funnel plus prayer:
//   approaches → gospel_presentations → professions_of_faith → reconciliations → referrals
const counter = z.number({ invalid_type_error: 'Informe um número' }).int('Use um número inteiro').min(0, 'Não pode ser negativo');

// The counter fields only (handy for iterating the form / summing the consolidated view).
export const EVANGELISM_METRIC_KEYS = [
  'approaches',
  'gospel_presentations',
  'professions_of_faith',
  'reconciliations',
  'referrals',
  'prayer_requests',
] as const;
export type EvangelismMetricKey = (typeof EVANGELISM_METRIC_KEYS)[number];

// "approaches" (people approached) is the funnel entry point: every other counter
// records a subset of those people, so none of them can exceed it.
const CAPPED_METRIC_KEYS = EVANGELISM_METRIC_KEYS.filter(
  (key): key is Exclude<EvangelismMetricKey, 'approaches'> => key !== 'approaches',
);

export const evangelismReportInputSchema = z
  .object({
    // ISO date (YYYY-MM-DD) — the day the numbers are about.
    report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    approaches: counter,
    gospel_presentations: counter,
    professions_of_faith: counter,
    reconciliations: counter,
    referrals: counter,
    prayer_requests: counter,
    notes: z.string().trim().max(2000, 'Observação muito longa').optional(),
  })
  .superRefine((data, ctx) => {
    for (const key of CAPPED_METRIC_KEYS) {
      if (data[key] > data.approaches) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Não pode ser maior que o número de pessoas abordadas',
        });
      }
    }
  });

export type EvangelismReportInput = z.infer<typeof evangelismReportInputSchema>;
