# IOP-168 — Publication and local activation

Status: Completed local activation, 2026-09-29; publication of this record is authorized.
Branch: `feature/IOP-168-shift-handover`, created from develop for the
[completed implementation](../completed/IOP-168-shift-handover-implementation-plan.md).

The owner explicitly approved merging this branch into develop, pushing both
branches to origin and updating the local Docker stack.

## Steps and validation

1. Run the existing local startup workflow to build images and apply migrations,
   preserving existing accounts, credentials, history and the approved private
   catalog (5 departments and 89 areas). Do not reset data or bootstrap credentials.
2. Verify container health, HTTP availability and configured catalog activation.
3. Update the permanent item and archive this evidence; check documentation links
   and whitespace and commit this publication increment on the story branch.
4. Merge the story into develop and push both branches to origin. Verify matching
   local/remote refs and a clean working tree. No stage/master promotion.

Expected tracked files: this plan and the IOP-168 item. Implementation validation
is recorded in the linked completed plan; this slice adds local activation checks.

## Evidence

- `npm run local:up` completed using Node 24.21.0. API, web and setup images built;
  migrations applied and all three persistent services report healthy.
- Seed reconciliation verified 78 dates, 42,220 rows, frequency 212,411 and
  56,391,042 exact seconds: zero dates imported, 78 unchanged. No account reset,
  credential bootstrap or volume replacement was performed.
- The running API container validates 5 departments, 89 areas, 6 categories and
  the configured Ultimo reference label using its compiled catalog adapter.
- Read-only database checks confirm all three handover tables and migrated active
  grants (2 contributors, 1 coordinator).
- HTTP checks at `http://127.0.0.1:8080`: root, both referenced application assets
  and health return 200; unauthenticated handover context correctly returns 401.
  Feature journeys were already validated in disposable environments; no synthetic
  entries or new sessions were created in the operator's database for this check.
- Remote fetch confirmed develop still points to `0922bff`, the implementation's
  base. Publication includes backend `0dc8c81`, UI `768156d` and this evidence commit.
  The authorized final step is a fast-forward into develop and publication of both
  story and develop refs to origin; verify their resulting hashes in the delivery.
