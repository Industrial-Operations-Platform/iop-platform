# IOP-243 — Confirmed same-date replacement plan

Status: Completed locally on 2026-11-23. On that date the owner selected confirmation on
reimport followed by replacement with the new file, superseding the standalone
withdrawal proposal. Record that decision as Accepted ADR-0040; no further design
approval is required for this authorized behavior.
Branch: `feature/IOP-243-import-day-removal`, from clean `develop` at `1d682ea`.
[Permanent scope](../items/IOP-243-import-day-removal.md).

## Changes and steps

1. Update this plan first, then synchronize the item, backlog and ADR-0040 with the
   owner's selected behavior. Retain the initial proposal as Git history (`d47d418`).
2. Integrations owns the import/replacement use case. Persist the exact prior import
   ID confirmed by the caller with the new receipt. On publication, compare/swap the
   scoped date claim, publish the new OIP facts, append OIP-owned supersession,
   finalize the new attempt and mark the old attempt superseded atomically. Retain
   original bytes/facts/outcomes and Audit evidence. Fresh import authority applies;
   use existing Administrator/profile enforcement and pinned transaction/lock order.
3. Add a forward migration with scoped provenance FKs, guarded terminal supersession
   and narrow column grants. Extend provisioning allowlists and offline reset order.
   OIP read adapters exclude superseded publications/facts from all current reads,
   manifests and cache/revision checks. Explicit source-file review retains history.
4. Extend the binary upload contract with an optional exact prior-import header,
   regenerate contracts, and expose current/superseded identity in import history.
   Web analysis opens a shared confirmation Dialog for an existing reporting date;
   cancellation sends nothing. Confirmed upload invokes an inward-owned use case,
   invalidates report caches and refreshes availability/history. English/German text
   uses shared identity/controls without feature-local styling.
5. Validate targeted use cases, atomic adapter/database behavior, authorization,
   migration/provisioning, stale confirmation, bad input, retained evidence, current
   reports and browser UI. Record limitations honestly. Run `npm.cmd test`,
   `npm.cmd run typecheck`, affected database cases and responsive Playwright checks.
6. Synchronize completion/evidence and links, archive the finished plan, commit
   coherent changes locally and ask before merging/pushing to origin.

Expected files: Integrations domain/application/PostgreSQL adapters and host gateway;
OIP receiver/read-model and all current-data read adapters; host runtime/controller/
contracts and generated OpenAPI/browser bindings; database migration, provisioning,
offline reset and focused integration tests; web analysis models/application/HTTP/
React, localization and focused unit/browser tests; ADR-0040, canonical import docs,
ARCHITECTURE.md and the ADR-0027/0028 cross-references; this story's item/backlog/plan.
No unrelated story or dependency translation.

## Validation and evidence

Acceptance scenarios: ordinary first import; today's unfinished date; confirmation
and cancellation; changed/identical same-date files; repeated replacements; invalid
CSV/receiver failure preserving the current data; stale confirmation after another
replacement; duplicate without confirmation; concurrent publication/preparation;
unknown acknowledgements and recovery of both old/new attempts; exact new totals,
coverage, equipment/message selectors, canonical/asset reads and cache revisions;
retained source-row/original review; current permissions, scope isolation, narrow
grants, migration and offline reset compatibility; desktop/mobile and localization.

Initial proposal increment `d47d418` changed documentation only. Its 15 relative
links, item/plan/backlog status and staged whitespace checks passed. Source inspection
confirmed that date parsing does not wait for day end and that browser/date claims
block accepted dates. That proposal's approval blocker is resolved by the owner's
explicit revised decision; its standalone Delete day endpoint will not be built.

Implemented confirmation on the existing upload form with shared Dialog/Actions.
The exact confirmed import is stored with the receipt. Publication atomically
advances the claim and records retained supersession; invalid, stale and rolled-back
replacements preserve the previous dataset. All current OIP reads use the shared
active-import predicate; source-file inspection retains old versions. Existing
ADR-0027 adapter transaction coordination is extended without moving SQL into the
framework-free workflow or browser application. Current grants, RLS and runtime
privilege restrictions remain enforced; no DELETE authority was added.

Validation:

- `npm.cmd test` passed: 576 API, 373 web, 78 database configuration and 110
  secrets-tool tests; four pre-existing optional secrets tests skipped. This also
  passed builds, design/architecture/localization guards and generated contract parity.
- `npm.cmd run typecheck` passed. After the final shared Actions adjustment, the
  web build/design guard and three targeted web suites passed all 26 cases,
  including two additional report-cache mutation cases added after the full run.
- Six actual-role PostgreSQL suites passed all 77 cases: import batches, reporting
  workspace, analytical POC, site material Audit, Asset domain and equipment catalog.
  The new replacement scenario covers changed/identical bytes, concurrent writers,
  stale confirmation, invalid CSV, receiver rollback, exact totals, coverage,
  selectors, original/source-row retention, reconciliation, profile rebuild and grants.
- A subsequently added PostgreSQL HTTP case passed independently: exact replacement
  header, invalid header, stale target and lost COMMIT acknowledgement. Recovery
  returns the committed replacement without replay and leaves one current import.
- Six final Playwright cases passed in 19.1 seconds: replacement confirmation and
  cancellation at 1440/375 px, German/dark at 375 px, analytical cache/navigation
  at desktop/mobile and preparation exclusions. Inspected the generated dialog
  screenshots; shared action spacing and wrapping are correct without overflow.
  Browser fixtures intercept synthetic business APIs; PostgreSQL cases use the real
  runtime role and disposable databases. Tests required elevated access to the
  existing Docker runtime and Windows child-process cleanup; both checks succeeded.
- `node --check infra/database/test/reporting-workspace.spec.cjs` and
  `git diff --check` passed. Final review verified 332 local links across nine
  changed documents, completed item/plan/backlog status and Accepted ADR-0040.

## Closure

Item/backlog completed locally and this plan archived. Existing operational data
and unrelated IOP-219 work were untouched. The new API requires the forward
`20261123000000-import-replacement` migration before activation, as exercised by the
database suites. No merge, push or deployment was performed. Publication of
`feature/IOP-243-import-day-removal` through develop to origin remains owner-controlled.
