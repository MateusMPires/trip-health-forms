-- Cap the evangelism funnel: "approaches" (people approached) is the funnel entry
-- point — every other counter records a subset of those people, so none of them may
-- exceed it (e.g. 7 approaches with 10 professions_of_faith is impossible).
--
-- Enforced in the app (@viagem/core Zod + the form steppers), but an offline client
-- could still post an out-of-range row, so the DB rejects it too — same rationale as
-- check_report_within_trip_window in 0019.

-- Normalize any pre-existing rows down to the cap so the constraint adds cleanly.
update public.evangelism_reports
set gospel_presentations = least(gospel_presentations, approaches),
    professions_of_faith = least(professions_of_faith, approaches),
    reconciliations      = least(reconciliations, approaches),
    referrals            = least(referrals, approaches),
    prayer_requests      = least(prayer_requests, approaches)
where gospel_presentations > approaches
   or professions_of_faith > approaches
   or reconciliations > approaches
   or referrals > approaches
   or prayer_requests > approaches;

alter table public.evangelism_reports
  add constraint evangelism_reports_metrics_within_approaches check (
    gospel_presentations <= approaches
    and professions_of_faith <= approaches
    and reconciliations <= approaches
    and referrals <= approaches
    and prayer_requests <= approaches
  );
