# Local operations

This guide covers the local infrastructure delivered by [IOP-208](../planning/items/IOP-208-local-delivery-infrastructure.md) and [ADR-0038](../architecture/adr/ADR-0038-local-operating-infrastructure.md). Run commands from the repository root with Node 24.21.0/npm 10.9.2. Docker is required for database backup/restore and real-database validation. Host commands remain explicit operator actions; no remote provider or plant command is registered.

## Full private backup and isolated restore

Generate one independent random encryption key in a private location outside every backup input. Keep a recoverable separate copy of this key; an archive cannot be restored without it. The command refuses an existing key file and requires mode 0600.

```sh
node scripts/local/full-backup.cjs key --key /private/operator/iop-backup.key
docker compose -f compose.platform.yaml stop api web
node scripts/local/full-backup.cjs backup --key /private/operator/iop-backup.key --output /private/operator/backups/platform.iopbk
docker compose -f compose.platform.yaml start api web
```

The running API holds a shared maintenance lease for its lifetime. Stop API/web and
any separately started workers or setup/import operations before backup, while
keeping `database` running. Backup waits at most 30 seconds for the exclusive
lease and reports an actionable failure if it cannot acquire it. Always restart
API/web after the backup command, including a failed attempt; these separate
commands deliberately leave the failure visible. Do not run `down`, remove volumes
or reset the installation. Coordinate the brief service interruption with operators.

The default source is `.local-platform` and the database container selected by `compose.platform.yaml`. This includes installation/environment files, credentials, configured JSON, locator reference PNGs and traces under that root. The full application database includes revision/history tables, job records and Audit. Existing `backups/` content is excluded to prevent recursive archives. Add `--private DIRECTORY`, `--container ID` or repeated `--references DIRECTORY` for other explicit roots; external assets omitted from these roots remain outside coverage. Regenerated Docker assets copied from the host are not a second source of truth.

Backup holds the shared platform maintenance lease exclusively and uses an exported PostgreSQL snapshot for both the custom dump and source fingerprints. Private files are hashed before and after archival; a concurrent file/configuration change causes failure. The encrypted authenticated manifest retains independent SHA-256 hashes, table counts/digests, owners, RLS flags and policy definitions, effective schema/table/column/function grants and application role properties. The supported bound is 2 GiB uncompressed and 20,000 files. Unsafe paths, symlinks, changed inputs, wrong keys and tampering fail without replacing source data. Files and directories are private; command output contains aggregate evidence only.

```sh
node scripts/local/full-backup.cjs restore --key /private/operator/iop-backup.key --input /private/operator/backups/platform.iopbk --destination /private/operator/restores/review-001
```

The destination must be new. Restore authenticates and checks every file, creates a fresh PostgreSQL container with no network or published ports, restores application roles/owners/grants and independently compares every captured table and catalog fingerprint. A verified container remains stopped with an `iop.restore` label; `restore-verification.json` records its name and aggregate evidence. Failures remove only the newly created database container, never the running installation. The verified private directory is retained for investigation if database verification fails.

Restore is a review artifact, not activation. Before a separately authorized activation, review copied credentials, origins, local addresses, configuration/reference paths and scoped operator targets. Purge expired restored Audit through the separate retention operator before application access. Do not connect applications to the restored data or execute the archived SQL on the active installation as part of this command. Global PostgreSQL installations, unrelated databases and custom role memberships are outside the local platform backup contract; the platform uses explicit `NOINHERIT` application roles without membership delegation.

Archives expire after 30 elapsed days. Pruning is an explicit operator command in a dedicated backup directory. It authenticates whole archives before removing only expired `.iopbk` files, examines at most ten per invocation, rejects changed archive identities and preserves unexpired or unauthenticated archives. Keep the key outside this directory.

```sh
node scripts/local/full-backup.cjs prune --key /private/operator/iop-backup.key --archives /private/operator/backups --limit 10
```

## Durable scoped jobs

Build the API and database tooling first. The job CLI reads the installation's runtime database credentials and configured organization/site from `IOP_CONFIG_FILE`. Supply the private `IOP_DATABASE_*` runtime environment in the trusted setup container or host environment. It is a trusted local operator/backend entry point; possession of runtime credentials is not a public login mechanism. The initiating user must currently be an Administrator with `jobs.manage`, in the configured scope, for submit, retrieval and every tick.

```sh
npm run build --workspace @iop/api
npm run db:build
node scripts/local/jobs.cjs submit administrator-id diagnostic-001 local-check 23 1
node scripts/local/jobs.cjs tick administrator-id
node scripts/local/jobs.cjs get administrator-id JOB_ID
```

The optional last submit number requests a synthetic transient failure until that attempt, exercising rollback and retry; it is bounded to four. `local-check` records one idempotent local effect and returns its value. It does not contact a provider. Tick processes at most one job for its current initiator, with a 60-second durable lease, row locking, five maximum attempts and bounded exponential backoff. A crashed worker leaves a recoverable expiring lease. Handler effects and successful/final outcomes commit atomically with Audit. Revoking a user's grant or changing their profile prevents later execution and retrieval; another Administrator cannot retrieve their records through this interface.

Reusing a request key with identical type/payload recovers the existing job; changed payloads conflict. Unknown handlers produce `waiting-handler` and missing configuration produces `waiting-configuration`, without consuming execution attempts. A handler declares exact payload keys, validation and required current business permission. Register actual integration handlers only after their adapter, idempotent effect, configuration and authority requirements are available. Unknown/internal database failures roll back the effect/outcome transaction and leave the prior durable claim for lease recovery. No global RLS-bypass polling role exists.

`composeJobs(pool, scope, handlers?, now?)` is the host integration factory in `apps/api/src/host/operating-composition.ts`. `JobHandler.execute(tx, job)` receives the same pinned authorized site transaction. A scheduler may invoke finite ticks with an explicit initiating user; scheduling itself does not grant access. HTTP navigation/UI or external transport is not required to use these local capabilities and remains a separate integration task.

## Audit operators and capture coverage

Runtime can append owner-defined safe versioned events and deduplicate them; it cannot browse event content, update or delete Audit. `appendAudit(tx, event)` requires the existing pinned business transaction so an append failure rolls back the material operation. The envelope contains source/recording times, IDs, safe lifecycle revisions/states and bounded reason codes; it excludes free-text source bodies, payloads, names, credentials and transport secrets. Change retention is 365 elapsed days from recording; policy/version/expiry are stored independently of the source occurrence time.

Provision inspection and retention using the local bootstrap configuration and an exact existing organization/site. Each creates a separate minimal PostgreSQL login and a new mode-0600 private credential file. Existing roles/files require separate credential-rotation review and are preserved. These commands require trusted local bootstrap credentials; never expose them in a browser or remote endpoint.

```sh
IOP_AUDIT_ORGANIZATION_ID=organization-id IOP_AUDIT_SITE_ID=site-id node infra/operations/audit-operator.cjs provision-inspect /private/operator/audit-inspector.json
IOP_AUDIT_ORGANIZATION_ID=organization-id IOP_AUDIT_SITE_ID=site-id node infra/operations/audit-operator.cjs provision-purge /private/operator/audit-retention.json
node infra/operations/audit-operator.cjs inspect /private/operator/audit-inspector.json investigation
node infra/operations/audit-operator.cjs purge /private/operator/audit-retention.json
```

Set bootstrap database environment from the private installation configuration in the trusted setup environment before provisioning. The function roles have exact schema usage and function execution only, with no table grants. Locked-search-path `SECURITY DEFINER` functions verify `session_user` and the registered target, enforce bounded pages/batches and retain forced scoped RLS under the migrator owner. Inspection records purpose atomically before the caller receives data and excludes already expired evidence. The inspection command returns sensitive operational metadata; protect redirected output. Retention has separate authority, captures one server cutoff, deletes at most 100 expired rows per CLI invocation (database maximum 1,000), and records a nonzero purge summary atomically. Repeat until a zero removal result; a zero purge produces no noise event.

| Capture | Implemented evidence | Remaining scope |
| --- | --- | --- |
| Jobs | Creation, durable claim, retries, waiting, completion, exhaustion/failure | Real business/provider handlers |
| Audit operator | Successful inspection and nonzero bounded purge | Operator credential rotation and scheduling |
| Journal/formal Handover | Entry revisions/resolution/removal; record correction/publication/closure/acknowledgement; delegated Maintenance resolution | None within those pinned database paths after mandatory host composition |
| Maintenance | Records/completion and priority configuration | External maintenance provider handlers |
| Assets | Canonical registry revisions; model catalog, enrichment/review and source-mapping sidecars | Plant verification and external provider handlers |
| Workforce | Settings, workers, schedules and assignment revisions/removal, with safe active/removed state only | External roster providers |
| Improvement Tracking | Action revisions, evidence/corrections and saved comparisons | External result providers |
| Locator | Scene/calibration revisions and their atomic placements | Offline reference-file import and actual survey evidence |
| Integrations/OIP | Registry configuration, import receipt/terminal/recovery, publication and applied reporting-profile configuration | Provider transport, distributed/chunk orchestration and file configuration activation |
| Organization RBAC | Existing module-specific access audit remains separate | General organization Audit envelope/capture |
| Platform security | No new security sink claimed | Distinct platform authority, allowlisted 90-day events and bounded denial/session capture |

The [site capture contract](site-audit-integration.md) lists explicit owner ports,
mandatory host composition and behavioral evidence. Original full Audit acceptance
in IOP-023/IOP-109 remains open for organization/security capture and external
operating criteria. Events reference safe owner revisions/version identities; Audit
does not copy their revision bodies. Product profiles receive no Audit browsing
permission. Backend/database credentials remain trusted authorities.

## CI, measurement and readiness

`.github/workflows/validation.yml` runs locked dependency installation, secret scanning, type/build/contract/unit/database/browser checks through `npm run test:poc` with Node 24.21.0/npm 10.9.2, read-only repository token permissions and synthetic disposable databases. It retains only synthetic browser failure artifacts for seven days. Remote CI execution is unverified until an authorized publication; a workflow file is not evidence of a remote pass.

Action major versions and hosted-runner requirements were verified against the
official [checkout](https://github.com/actions/checkout),
[setup-node](https://github.com/actions/setup-node) and
[upload-artifact](https://github.com/actions/upload-artifact) repository READMEs
on 2026-10-14.

```sh
node scripts/local/measure-readiness.cjs typecheck 3 /private/operator/measurements/typecheck.json
```

Allowlisted commands are `typecheck`, `unit`, `database`, `browser` and `build`; one to ten samples run existing repository checks. A new private output file captures system/Node facts, wall times, exit codes and min/p50/p95/max. It does not capture command logs or accept arbitrary shell text. Reports explicitly retain `target: unagreed` and pending release acceptance. Synthetic measurements do not establish a plant workload/SLA, restore-time commitment, operational monitoring coverage, provider connectivity or production readiness. Establish those external targets and evaluate agreed workloads separately.
