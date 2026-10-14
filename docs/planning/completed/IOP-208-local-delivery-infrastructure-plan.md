# IOP-208 — Local operating infrastructure execution plan

Status: Completed local infrastructure and site-material Audit slice. Owner delegation: 2026-10-14, [IOP-203](../items/IOP-203-platform-completion.md). Item: [IOP-208](../items/IOP-208-local-delivery-infrastructure.md). Branch: `feature/IOP-208-local-delivery-infrastructure`, from `develop` at `24b6269`.

## Scope and steps

1. CI runs established root/type/unit/contract/design/architecture/secret and disposable PostgreSQL/browser checks using pinned Node and existing tooling. Remote execution requires publication and remains unverified.
2. Private encrypted full database/configuration/PNG-reference backup, authenticated integrity metadata and independently isolated verified restore. Preserve the active installation; never run archived SQL on it. Bounded local Docker transport and explicit supplied private roots.
3. Scoped PostgreSQL job leases, idempotency, bounded retries and missing-handler states. Execution/retrieval rechecks current initiating-user authorization; no global RLS-bypass worker.
4. Audit append/inspection/retention contract under Accepted ADR-0017, explicit allowlisted schemas and capture coverage. Separate inspector/retention database authority; ordinary runtime has no delete/update. Narrow optional owner-defined emit ports and host composition only.
5. Repeatable local measurements/readiness, operating guides and evidence. Keep unagreed workloads/thresholds, real providers, broad emitter coverage and release acceptance pending.

Files: `.github/workflows/`, `scripts/local/` encrypted backup/restore/measurement CLIs and owning tests; `apps/api/src/modules/{jobs,audit}/`, new host composition/contracts/controllers as required; `infra/database/migrations/20261014050000-operating-infrastructure.sql`, separate operator helpers/tests; `docs/development/local-operations.md`, delegated concrete ADR and this item/plan.

Parent owns shared runtime/controller/navigation, RBAC catalog/backfill, main provisioning allowlist and package manifests/generated contracts. Temporary test copies of those seams are restored before commits. New software must use existing dependencies unless parent updates the lockfile.

## Language and validation

Read stories IOP-010/021/023/024/112–115/134–135/137–138 plus dependencies. Translate the Spanish API paragraphs in IOP-134/135/137 completely; preserve other English prose, statuses, IDs and links. Record translation-only edits separately.

Verify encrypted round trips, wrong-key/tamper/traversal rejection and exact private-file recovery; disposable actual PostgreSQL dump/restore data/grants/RLS; current job grants, leases/retries/idempotency and missing handler behavior; atomic Audit rollback, sensitive-field exclusion and scoped inspection/purge authority. Use Node 24.21.0, focused owning suites and root integration checks. Record actual results before closure/commits; do not infer CI execution or production readiness.

## Evidence and handoff

- Full API: 31 suites/423 tests passed. Updated domain tests: three passed after
  canonical payload/envelope ordering and source-time validation.
- Scripts: four suites/23 tests passed, including private exact roundtrip,
  overwrite protection, wrong-key/tamper/path/symlink rejection and authenticated
  bounded expiry pruning; file handles are closed on rejected archives.
- Real PostgreSQL: two owning suites/seven tests passed. Full restore preserves
  nonempty Handover revisions and completed job effects/Audit, complete table
  digests, role properties, grants and forced RLS. A final additional full restore
  passed with exact RLS policy definitions and role-membership refusal included.
- Worker/Audit checks cover atomic transient-effect rollback, exact-once local
  effects, current grants/profile/initiator, expired lease recovery/exhaustion,
  configuration/handler pending states, append dedupe/rollback, separate bounded
  operators, inspection-before-return, expiry filtering and no broad table/runtime
  mutation privileges.
- API typecheck and secret hygiene pass. Full typecheck measurement passed one
  observed 42.524 s sample; no plant target or release pass is inferred.
- Translation-only edits: IOP-134/135/137 API paragraphs, preserving original
  statuses and context. Referenced original stories remain open.
- Shared RBAC/provisioning test copies and temporary permission migrations were
  restored/removed before commits. Root assembles catalog/backfill, exact
  allowlists, setup-image CLI copies and integrated installation validation.

Operating guide records API/web/worker stop, database-preserving backup and service
restart after success or failure; lease errors explain that prerequisite. CI remote
execution, general RBAC/security Audit and other owners' capture/provider handlers
remain explicit external or parent gaps. No push, merge, activation or remote action.

## Authorized site-material Audit increment (2026-10-14)

Owner delegation under IOP-203 extends the completed infrastructure slice with
explicit owner-defined atomic events for existing site material operations. Reuse
Accepted ADR-0017/0038 and pinned append. Cover journal/formal Handover,
Maintenance, Assets, Workforce, Improvement Tracking, Locator, integration
registry and OIP publication wherever the owner already has a site transaction.
No plant input, generic SQL logging/triggers, new UI or expanded runtime grants.
Organization RBAC and platform-security contracts remain pending.

Files: module-owned PostgreSQL store/repository adapters and small optional emit
ports where composition is required; owning behavioral tests; the Audit envelope
module/event allowlist; operating guide and this item/plan. Root owns shared host
composition, schema generation, permissions and provisioning. Temporarily copied
child module dependencies are restored before commits; only this increment's
changes are retained. Verify real first-wave events, atomic failure rollback for
Handover/Assets, idempotent recovery and absence of free text/names/payload/secrets.

Additional existing pinned seams discovered during owner inspection: delegated
Maintenance resolution writes journal entries without PgHandover.save, and OIP
reporting profile configuration has its own validated atomic write/project path.
Instrument both explicitly; derived per-fact projections stay under their enclosing
publication/mapping/configuration event rather than generating alarm-row records.
Supplemental catalog migration uses 20261014070000-site-material-audit.sql, leaving
root-owned IOP-209 asset-domain timestamp60000 intact.

## Site-material increment outcome

- Published `Audit` index exposes pinned `SiteMaterialAudit`/`SiteMaterialEvent`
  types; owner adapters reference that public port. Implementation remains
  host-composed. Exact per-module/action catalog is independently matched to SQL.
- Thirteen owner adapters and six mandatory host composition files are delivered
  as a reviewed integration patch for IOP-203 assembly. It applies cleanly against
  current root, preserves all prior contracts/projections and includes independent
  AssetDomain catalog/enrichment/mapping and delegated Maintenance resolution.
- Actual PostgreSQL material suite: ten tests pass. Combined with worker/operator
  and encrypted full-restore suites: three suites/17 tests pass. Real INSERT
  privilege denial and after-append exceptions roll back Handover/Assets records,
  retained revisions and events; source content/names/credentials are excluded.
- Current patched mandatory host typecheck/build pass. Full API32 suites/428
  tests pass, including schema/privacy owning checks; parent runs combined installation gates.
- All temporary module/host/RBAC/provisioning/migration dependency copies are
  restored before commit. Parent applies owner/host hunks under its current plan;
  this branch commits only the new public port/adapter, catalog, tests and docs.
- Organization RBAC, platform-security90-day capture, file activation boundaries,
  real provider transports/distributed chunk phases, operator rotation/scheduled
  alerts and external acceptance remain explicit gaps. No extra grants/UI,
  generic SQL logging/triggers, remote action or publication.
