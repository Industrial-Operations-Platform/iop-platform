# Improvement Tracking operation

The root platform composes `composeImprovements(pool, source, locations,
initialProfileVersion, analysisCalendar)` in the API host, registers
`ImprovementController`, and composes the web application/gateway/workspace. Run
the normal local setup/migration path before starting the updated host. Do not
grant roles manually to bypass current profile restrictions.

## Storage and permissions

`20261014020000-improvement-tracking.sql` creates scoped `improvement.actions`,
immutable `revisions`, `evidence` and `comparisons`. All tables force RLS, use
organization/site keys, bounded snapshots and explicit column grants. Runtime can
update current action content only; it has no evidence/history update/delete or
DDL privileges. Asset and owner references use scoped foreign keys. Source-owned
ports validate Handover links and enforce Assets/Handover/OIP permissions separately.

Each operation uses the existing pinned site transaction, shared current-access
lease and site-specific improvement lease. Current profile/grants, expected
revision and evidence writes are checked in that transaction; a failed revision
write rolls back current/evidence writes together. The Users/RBAC responsibility
projection may read only the Tracking contributor role under an already installed
site business context; preauthorization candidate lookup remains actor-specific.

The root delivery owns role bundles/backfill, the production postmigration privilege
allowlist, reviewed OpenAPI generation and final shared workspace activation.
The feature-specific German dictionary is `localization/improvement-de.ts` and is
spread into the shared presentation dictionary; English remains canonical.

## Business routes

All routes are POST under `/api/v1/improvements` and require the normal authenticated
session, allowed origin and current scoped access. Inputs reject extra fields and
query-string scope declarations.

| Route | Behavior |
| --- | --- |
| `catalog`, `issues` | Eligible owners, locations, assets and bounded issue lookup |
| `query`, `history` | Full matching counts, cursor actions and retained revisions |
| `save` | Create/edit with stable ID, expected revision and reason |
| `add-evidence`, `evidence` | Append note/result/correction; cursor history |
| `compare` | Calculate a current source snapshot without persisting |
| `save-comparison`, `comparisons` | Recompute/save attributed source evidence; cursor history |

Invalid input returns 400, current role/grant denial 403, inaccessible references
404, stale content/conflicting request IDs 409, unavailable data/capacity 503.
Out-of-range analytical totals return 422. Problem Details sanitize storage faults.
Reload after a conflict; do not overwrite a newer revision automatically.

## Validation

Use Node 24.21.0 and the repository commands. Focused checks:

```sh
npm run build --workspace @iop/api
npm test --workspace @iop/api -- --testPathPatterns=improvement
npm test --workspace @iop/web -- --testPathPatterns=improvement
npm run db:build
node --experimental-vm-modules node_modules/jest/bin/jest.js --config infra/database/jest.config.cjs --runInBand --testPathPatterns=improvement
```

The real PostgreSQL suite creates a disposable Docker database and synthetic source
imports, assets and issues. It validates stale-write serialization, role/scope
denial, immutable evidence, transaction rollback, projection validity and period
coverage. It does not connect to plant systems or establish production causality.
See the [completed execution record](../planning/completed/IOP-205-improvement-tracking-plan.md).
