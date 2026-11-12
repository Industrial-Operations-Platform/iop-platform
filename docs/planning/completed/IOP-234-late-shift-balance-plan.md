# IOP-234 — Correct current-week late-shift coverage

Status: Completed. Branch `fix/IOP-234-late-shift-balance`, from develop `ac7d55d`.
[Permanent scope](../items/IOP-234-railway-monthly-roster.md).

## Requested correction

The owner reports that the online view shows early/middle shifts with too few late
technicians. Live inspection found all 17 technicians on early hours every working
date November 9–14. Earlier month-level coverage checks missed this retained week.
This correction authorizes adjusting that existing evaluation week on Railway.

## Steps and boundaries

1. Reuse the existing monthly operator's explicit conversion path and atomic
   person/week application transaction. Add a dated technician-balance option for
   the reported week. Alternate sorted active technicians between early and late
   each working date, distributing 8/9 per shift while rotating each person's
   early/late exposure. Retain work dates, days off, duty IDs and zone/phone
   references. Task Force remains on its requested middle hours.
2. Prepare exact expected schedule/duty revisions. Check phone overlaps and apply
   the complete affected week in one existing scoped transaction so phone transfers
   and schedule/duty changes validate together. All prior revisions remain retained.
   Domain validation stays in Workforce, operator orchestration in Railway tooling.
3. Add a regression that checks each date's early/late coverage, preview live data,
   refresh the private backup and apply the reviewed correction. Verify both
   schedule hours and board assignment shift IDs per date, plus rerun no-op.
4. Record evidence, commit, integrate and push the correction under the owner's
   continuing Railway/develop authorization. Check automated publication status.

## Validation

Run relevant scripts tests, syntax and whitespace checks. Verify actual current
week counts and person coverage, revision retention and preserved unrelated data.
Use existing Railway development target/authority guards and private evidence.

Pre-apply evidence: full scripts suite passed 106 tests with four platform skips;
seven focused tests passed after the final week-only scope guard. The live preview
contains exactly 51 schedule/duty conversions across all 17 technicians and zero
new dates. None of the 51 duties carries a phone. A fresh protected PostgreSQL
archive (30,476,440 bytes) was exported and its archive list inspected. Before
counts are 2,797 Workforce records, 2,893 revisions and 167 analytical publications.

## Execution evidence

- Source correction `98eb0ec` extends the existing operator and makes the complete
  conversion batch atomic across affected people. Its week option only changes
  existing working dates in the selected week. Daily coverage regression passed
  with all 17 retained technicians and the unchanged Task Force middle example.
- Applied exactly 51 schedule and 51 duty conversions in Railway development.
  Retained IDs, location/duty/phone fields and every unrelated snapshot were checked.
- Live schedule and weekly-board assignment counts match for every date. November
  9/11/13 each have 9 early and 8 late technicians. November 10/12/14 each have
  8 early and 9 late. Each technician has three early and three late work dates.
- Immediate preview returns zero additions and conversions. Exact history comparison
  verified all 102 original revision snapshots. Workforce retains 2,797 records and
  now has 3,046 revisions. All 167 analytical publications remain present and Task
  Force has no November working hours outside the configured middle interval.
- Private preview/apply, backup and verification evidence is retained under the
  existing `.railway/` directories. Syntax, whitespace and affected-document links
  checked. No browser interaction was needed for the data correction.

Item/backlog synchronized and this record archived. Integrate the correction and
evidence into develop and push the named review branch and develop under the
owner's continuing publication authorization. The visible data correction is
already applied and verified independently of subsequent tooling image packaging.
