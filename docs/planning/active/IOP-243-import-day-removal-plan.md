# IOP-243 — Import-day removal and reimport plan

Status: Blocked on acceptance of Proposed ADR-0040. The proposal increment is
complete; dependent implementation is pending. Authorized by the owner's
2026-11-23 request to remove an imported day so that today's evolving CSV can be
imported again before day end.
Branch: `feature/IOP-243-import-day-removal`, created from clean `develop` at
`1d682ea`. Permanent scope: [IOP-243](../items/IOP-243-import-day-removal.md).

## Changes and steps

1. Record the request in the permanent item and backlog. Inspect date admission,
   duplicate detection, publication ownership, read revisions and retained evidence.
2. Write Proposed [ADR-0040](../../architecture/adr/ADR-0040-import-day-withdrawal.md)
   for explicit logical withdrawal. Current Accepted ADR-0027/0028/0033 do not
   define withdrawal or releasing a successful date for reimport. Under AGENTS.md
   rule 5, pause dependent implementation until the owner accepts this refinement.
   Complete and commit the independent documentation increment.
3. After acceptance, implement an Integrations-owned withdrawal use case behind
   inward-owned ports, an OIP-owned publication withdrawal port, and host composition
   on the existing pinned transaction. Introduce forward schema/grant migrations,
   retained claim release, OIP withdrawal markers and atomic Audit capture. Preserve
   originals, successful import outcomes, facts, quota charges and other scopes.
4. Update all OIP active-data reads and revision/cache inputs, including report
   availability, comparisons, equipment/message catalogs, canonical analytics and
   live analytical asset history. Keep explicit historical import review available.
   Make reconciliation distinguish active and withdrawn successful imports.
5. Add the import-history action, date/file confirmation and withdrawn state using
   shared controls and English/German resources. Refresh history/availability and
   invalidate browser reports after withdrawal or an uncertain mutation outcome.
   Permit normal upload of the released date, including the current calendar day.
6. Run the relevant implementation checks below; record evidence, synchronize scope
   and status, archive this plan only when finished, and create logical local commits.
   Publication requires separate authorization under ADR-0008.

Expected documentation files: this plan, the IOP-243 item, backlog and ADR-0040.
Expected implementation files after acceptance: Integrations domain/application/
PostgreSQL adapters; OIP receiver, reads/projection/revision adapters and application
port; Users/RBAC permission catalog and provisioning allowlists; Audit emitter;
host composition/controller/contracts and generated OpenAPI; forward database
migration and relevant reset tooling; web analysis models/application/HTTP/React,
localization; focused API/web/database/browser tests; canonical import and query
documentation. Verify exact paths and lock ordering before implementation edits.

No story translation is needed: the read IOP-047, IOP-158 and IOP-242 contexts are
English. Existing IOP-219 activation work is unrelated and remains untouched.

## Validation and evidence

Documentation: check Markdown targets, IOP/ADR identifiers, item/backlog states,
Proposed versus Accepted wording, traceability to inspected code and `git diff
--check`. Do not claim runtime changes from documentation-only work.

Implementation after acceptance: run `npm.cmd test`, `npm.cmd run typecheck`, the
real PostgreSQL import/OIP/reporting/authorization/migration cases and affected
Playwright suites. Cover current-day first upload, withdrawal, same-day reimport,
identical and changed bytes, duplicate rejection while active, exact new totals,
withdrawn-only gaps, retained original review and recovery, stale/repeated requests,
concurrent withdraw/import/profile save, rollback and lost acknowledgements,
revoked grants, scope isolation, migration/backfill and offline reset compatibility.
Inspect desktop/mobile rendering, cancellation and English/German UI states; run
architecture, contract, localization and design guards with the web build.

Completed proposal evidence (2026-11-23):

- Confirmed `parseCsvReportingDate` in the CSV adapter checks calendar validity
  without a clock/day-end restriction. `ImportWorkspace.tsx` disables known
  successful dates, and `ImportBatches.publish` enforces a scoped unique date claim.
- Inspected claim/publication/fact migrations, retained terminal outcomes,
  `ImportBatches.reconcile`, OIP report fingerprints, projection locking and browser
  report invalidation. Existing contracts do not safely support row-only removal.
- All 15 relative Markdown targets in the three new story documents resolve; the
  new backlog target exists. IDs, Proposed status and the item/plan/backlog blocker
  agree. `git diff --check` and `git diff --cached --check` passed.
- No application code, operational data or runtime configuration changed. API,
  database and browser tests are not applicable to this documentation increment;
  implementation validation remains pending. No dependency translations required.

## Closure

Keep this plan active and the parent item open while ADR-0040 awaits acceptance.
Commit the completed proposal increment even though implementation is pending.
No merge, push, deployment or deletion of operational data is authorized by this
plan. Ask separately about publication of the named branch through develop to origin.
