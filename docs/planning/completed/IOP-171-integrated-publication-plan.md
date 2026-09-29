# IOP-169/170/171 — Integrated publication and local activation

Status: Completed. Working branch: `feature/IOP-171-technician-access`, originally
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

## Local activation and publication

- `npm run local:up` completed with Node 24.21.0; database, API and web are healthy
  at `http://127.0.0.1:8080`. Fourteen migrations are applied.
- Read-only before/after counts match exactly: 4 users and credentials, 2 handover
  entries, 3 revisions, 60,735 analytical facts, frequency 316,864 and 79,968,310 seconds.
  Seed reconciliation reports 78 unchanged dates / 42,220 seed rows, zero newly imported
  dates. No reset, credential bootstrap, synthetic record or user session was created.
- Current grants confirm Technician: analytics false, handover true. Administrator,
  Task Force and Team Leader retain analytical and handover grants. The running catalog
  retains 5 departments, 89 areas and 6 categories.
- Root, health and both referenced application assets return 200. Served JavaScript
  contains the integrated profile/daily-overview controls. Anonymous session has no
  analytical capability; anonymous handover access returns 401.
- Merge commits `840fb7b` and `f8902b7` preserve story histories. Develop advanced from
  `8575856` to `f8902b7`; an atomic push published develop plus all three approved story
  branches to origin. This documentation closure is committed on the IOP-171 branch
  and fast-forwarded/pushed to develop under the same approval.
- Final whitespace, documentation links/statuses and secret hygiene passed. The first
  integration-commit attempt was blocked by an automatic tool usage limit; the owner's
  instruction to continue allowed the direct retry. No workaround or policy bypass.

Logs: `/tmp/iop171-integrated-tests.log`, `/tmp/iop171-integrated-database.log`,
`/tmp/iop171-integrated-browser-final.log`, `/tmp/iop171-local-update.log`.
No stage/master promotion, branch deletion or history rewrite was performed.
