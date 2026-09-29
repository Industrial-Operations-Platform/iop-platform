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
