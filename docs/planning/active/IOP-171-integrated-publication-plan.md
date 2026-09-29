# IOP-169/170/171 — Integrated publication and local activation

Status: In progress. Working branch: `feature/IOP-171-technician-access`, originally
created from develop. Owner explicitly approved merging all three story branches into
`develop`, pushing those four refs to `origin` and updating Docker on 2026-09-29.

## Scope and steps

1. Verify clean refs and remote develop, then integrate the approved IOP-169 handover
   board and IOP-170 administrator workspace into this review branch without rewriting
   their history. Resolve overlaps preserving all three accepted stories.
2. Complete the recorded integration points: Technician layout preview must hide
   analytics; Team Leader preview selects the daily handover overview. The bounded
   imported equipment picker remains available to handover contributors without granting
   access to analytical reports. Preserve receiving-module scope checks and exact codes.
3. Update combined browser/integration expectations and operator documentation. Run
   root npm test, real PostgreSQL/auth/handover suites and desktop/mobile browser checks.
4. Record pre-update aggregate counts, rebuild through `npm run local:up`, apply the
   scoped migration and verify health/assets, catalog and preserved data/account counts.
   Do not reset credentials, volumes, or create synthetic operator records/sessions.
5. Synchronize permanent story records, archive evidence, commit on the review branch,
   advance develop and push the three story refs and develop to origin. Verify refs and
   a clean tree. Stage/master and branch deletion remain outside this authorization.

Expected files: integration conflicts in host/UI/tests/ADR/backlog; host equipment
composition, role-preview presentation, affected browser fixtures, product/operator
instructions and planning records. No new product scope or architectural pattern.

## Integrated validation

- Typechecking passed after both conflict resolutions. Root `npm test` passed:
  18 secret-check tests, 325 API tests, 73 web tests and 77 database configuration
  tests; builds and generated API/browser contracts match.
- Real PostgreSQL suites (handover, transitional access, database lifecycle):
  3 suites / 24 tests passed. Restricted Technician creates entries using imported
  codes while direct analytical requests return 403; migration and profiles verified.
- Full Playwright suite: 9 passed at desktop/mobile widths. Technician preview hides
  analysis and Team Leader preview opens the six-section Daily overview.
- Extended the month-comparison HTTP fixture for current operational Start requests;
  all browser checks then passed. Inspected integrated mobile preview screenshot.
- Baseline live totals: 4 users/credentials, 2 handover entries, 3 revisions;
  analytical facts 60,735, frequency 316,864, exact seconds 79,968,310.
