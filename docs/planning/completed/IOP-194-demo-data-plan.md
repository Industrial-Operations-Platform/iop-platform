# IOP-194 — Local Maintenance and Assets demo data

Follow-up to [IOP-194](../items/IOP-194-maintenance-asset-history.md), requested
by the owner on 2026-10-05 to explore the new functions with placeholder data.
Branch: `feature/IOP-194-maintenance-asset-history`; existing story continuation.
M9 remains excluded. Existing local data and owner edits must be preserved.

## Scope and steps

1. Add an explicit local-only preview/apply/inspect command following the existing
   Handover demo tooling pattern. Freeze a private manifest before writes.
2. Create clearly marked fictional assets and maintenance records through their
   application ports, with states, dates, ownership and attributed histories.
   Retrying resumes unfinished prefixes and preserves subsequent owner edits.
3. Add focused fixture tests; document the command and review walkthrough.
4. Apply to the running local Docker installation, inspect coverage and retry
   stability, record evidence, synchronize the item and commit this increment.

Files: `scripts/local/maintenance-assets-demo*.cjs`, `infra/database/test/maintenance-assets-demo.spec.cjs`,
`package.json`, `docs/development/maintenance-assets.md`, this plan and IOP-194.
No credential changes, analytics imports, production seed or automatic alias
mapping. Reuse current authorization, scoped directories and module stores.

## Validation

Fixture tests cover all statuses, history and retry preservation. Run API tests,
the secret scanner, local preview/apply/inspect twice, and compare non-demo data
and analytics before/after. Publication remains branch-only; no develop merge.

## Evidence

Completed 2026-10-05 using Node 24.21.0 / npm 10.9.2.

- Six fixture tests pass against the actual module validators and retry logic:
  all states, dates, missing teams, incomplete configuration, prefix resumption,
  later owner edits and refusal to overwrite divergent unfinished history.
- API: 384 tests / 27 suites pass. The first sandboxed run could not bind local
  sockets; the permitted rerun passed. Secret hygiene and `git diff --check` pass.
- Live preview wrote nothing. Apply created 10 assets (3 simulated validated,
  2 unverified, 5 retired) with 18 asset revisions and 30 work records with 75
  revisions (15 Open, 5 In progress, 5 Blocked, 5 Done). Existing people and teams
  supply 25 person and 15 team assignments; 25 records link to assets.
- Live queries expose 20 first-page records, a next page and 70 Maintenance
  timeline events through the published owner read adapter.
- Two repeat applies retain the same record/revision counts and demo digest.
  Non-demo digest remains unchanged: 63 Handover entries / 129 revisions and
  analytical totals of 60,735 facts / 316,864 frequency / 79,968,310 seconds.
- No analytical or Handover aliases were invented. Source history for fictional
  identities is intentionally empty; this limitation and the review walkthrough
  are documented in the operator guide. M9 remains deferred.
- Clean-code review: generation/retry orchestration is independent of Docker and
  SQL; the launcher and scoped PostgreSQL composition are explicit local adapters.
  Writes use the existing module application ports. Evidence queries are read-only.
  No business module, transport, UI or new architectural pattern was introduced.

Publication is restricted to this story branch on origin under the owner's
existing explicit authorization; no merge into develop.
