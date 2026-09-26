# IOP-042 — Batch storage implementation

Status: Completed — internal batch storage increment; parent remains In progress
for the production importer handoff and delivered-path verification. Continues the owner's IOP-042 request and explicit acceptance
of [ADR-0027](../../architecture/adr/ADR-0027-poc-import-publication.md) on 2026-09-26.
Branch: `feature/IOP-042-import-batch-storage`, from clean develop after authorized
publication of the [design increment](../completed/IOP-042-import-batches-plan.md).

## Scope and files

Implement the batch-owned persistence and lifecycle behind internal contracts:
complete immutable receipts, dataset quota, scoped date claims, terminal counts,
publication coordination and explicit reconciliation. Preserve accepted bounds.
The OIP receiver is an injected owning-module contract, exercised using disposable
test tables; do not implement analytics, CSV parsing, mappings or HTTP activation.
The host must later supply trusted configuration, bounded receiving/parsing and
execution cancellation. This increment does not claim an end-to-end importer.

1. Add the seventh Integrations migration under `infra/database/migrations/` with
   forced scoped RLS, narrow column grants, immutable receipt fields and quota.
2. Add API-local Integrations contracts/service under `apps/api/src/modules/integrations/`.
   Reuse ADR-0026 transactions; source and actor come from trusted internal callers.
3. Extend `infra/database/provision.ts` only for exact installed column grants;
   update existing migration-count fixtures and add actual-role batch integration
   tests under `infra/database/test/`. No production OIP table is introduced.
4. Document internal integration obligations and evidence in the database guide,
   batch model, ADR, item, data model and delivery map. Synchronize the architecture,
   modules, RAW and preservation overviews where they still describe batch storage
   as absent. Keep unfinished integration
   criteria open rather than claiming a functional CSV-to-analysis journey.

## Validation

Run typecheck, `npm test` and `npm run test:database` using disposable PostgreSQL.
Exercise receipt integrity/rollback, scope denial, quota and date races, whole-batch
publication rollback, lost acknowledgement, terminal-state guards and recovery.
Check changed documentation links, statuses, secrets and `git diff --check`.
Commit only planned changes. This new implementation branch requires separate
publication permission; the previous approval covered the reviewed design branch.


## Evidence — 2026-09-26

Used Node 24.21.0/npm 10.9.2 from `/private/tmp/iop-017-runtime/node_modules/.bin`
and disposable PostgreSQL 17.6 containers. No operator database was migrated.

- `npm run typecheck`: passed API, web and database TypeScript checks.
- `npm test`: passed 9 secret checks, 131 API tests, 15 web tests and 77 database
  configuration tests; application builds and browser contract check passed.
- `npm run test:database`: 138 tests across nine suites passed, including ten
  batch integration scenarios. The final rerun with the quota charge-only trigger
  also passed all 138 tests (58.293 seconds); runtime quota reset is rejected.
- After making the committed publication result explicit (`succeeded` or
  `duplicate-date`), typecheck and all ten batch integration scenarios passed again.
- Documentation validation passed for 156 local links in eleven changed Markdown
  files; parent In progress, completed increment and Accepted ADR statuses agree.
  `git diff --check` passed; staged secret hygiene passed for 394 indexed files.
- The first commands used the shell's incompatible Node 20/sandboxed listeners;
  reran with the repository-required Node 24 and authorized local socket access.
  Corrected test setup to respect insert-only membership seeding, and updated all
  fresh-database/CLI migration expectations from six to seven. One initial Docker
  port-binding timeout did not recur in the complete successful rerun.
- Checked known versus unknown counts, exact RAW round trip (including 5 MiB),
  invalid/oversize receipt, bounded sanitized diagnostics, explicit failure, same-date
  races, independent source/site namespaces, quota races at both maxima, receipt and
  publication rollback, count mismatch, lost receipt/publication acknowledgements,
  repeated reconciliation, live-phase exclusion, delayed/expired publication,
  inconsistent evidence, permission revocation, RLS, immutable fields, scoped foreign
  keys, pool reuse, exact grants and quota drift detection.

The production OIP receiver is deliberately absent. Its disposable test implementation
proves the pinned transaction handoff and all-or-nothing writes, not CSV parsing,
normalization, metric reconciliation or the full analytical journey. The host must
still bind trusted source/site configuration and enforce receiving/parsing deadlines,
one-upload admission and stopped execution before recovery. No HTTP/UI, worker,
automatic replay, reset or source adapter was added. The parent criterion for the
complete delivered importer remains open; subsequent work belongs to the owning
stories and does not justify self-assigning them here.

Local publication of the new implementation branch is not covered by the owner's
approval for the earlier documentation branch. Ask before integrating/pushing it.
