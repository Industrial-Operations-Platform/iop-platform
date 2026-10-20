# IOP-217 — Execution record

Completed on 2026-10-20 under the [owner request](../items/IOP-217-admin-configuration-demos.md).
Branch: `feature/IOP-217-admin-configuration-demos`, created from clean `develop`.
Permission increment: `79df3af`; demonstration tooling and closure are committed
as the next local increment. Publication remains subject to owner approval.

## Delivered changes

- Current Administrator authority and module grants now protect Asset registry,
  models, types, surveys, mappings, Integrations, Workforce/Maintenance settings,
  reporting configuration and password-mode import administration. Existing
  assignments are revoked by a forward migration; stale grants cannot bypass the
  receiving adapters. Operational reads, contributions and leader planning retain
  their existing permissions. Browser navigation, forms and profile previews agree.
- Native browser context projects a stored scoped profile instead of inferring
  Administrator authority from import grants. Explicit trusted native importers
  retain their existing scoped submission/preparation contract.
- [Local scenario tooling](../../development/operational-demos.md) uses existing
  module applications, current scoped authorization and a private retained manifest.
  It fills missing weekly planning, retains logical deletions, creates a clearly
  synthetic Unverified asset and demonstrates Improvement and Formal Handover.
  Existing retired assets, users, credentials, settings and source facts remain intact.

Ownership follows Accepted ADR-0032/0037/0039: Users/RBAC owns current authority,
module adapters enforce configuration rules, the host composes mode/profile
presentation, and local scripts own synthetic scenario data. Architecture, Asset
and Integration contracts and operation guides were synchronized. Dependency
stories 204/205/207/209/215 were already English; no translations were necessary.

## Installed-history reconciliation

The existing database had already applied
`20261014090000-administrator-assets-locator`, absent from develop. Restored its
exact SQL from `f737191` and listed both configuration migrations in the bounded
demo-maintenance inventory. Strict ordering and locks remain enabled; no branch
merge, historical replay or migration-history rewrite occurred. The original
Asset/Locator revocations agree with the owner's current restriction.

## Validation

- Repository typecheck, API/web/database builds and browser contract check passed.
- Full API: 50 suites, 531 checks passed. Full web: 235 checks covered; two
  five-second timeouts during concurrent builds passed unchanged in a focused
  rerun (3/3). No timeout or test configuration was relaxed.
- Affected real PostgreSQL suites: 68 checks passed; 15 were repeated successfully
  with the restored migration inventory. Database configuration checks: 77 passed.
- Script suite: 37 checks passed, including 10 lifecycle, preservation, canonical
  JSON and tombstone checks. Indexed secret hygiene and Git whitespace checks passed.
- Focused Playwright: 18 scenarios passed. Administrator and operational preview
  screenshots were inspected at desktop and 390px widths; shared identity,
  source evidence navigation and bounded layouts remain intact.
- Updated local API/web/database are healthy. Standard setup verified all 78 seed
  dates and 42,220 reference rows: zero dates imported. An initial setup/startup
  attempt failed during heavy concurrent validation; a sanitized startup probe
  and the unchanged standard setup succeeded after that validation finished.
- Actual installed permissions: 250/250 read-only assertions passed across all
  25 active users (1 Administrator, 4 Team Leaders, 3 Task Force, 17 Technicians).

## Persisted demonstration evidence

For 2026-10-19–2026-10-25, all 25 users have seven daily records (175 total).
The application added 77 missing schedules and 55 assignments; all 139 working
user-days have assignments, and every active user has at least one assignment.
No retained weekly deletions existed; rerun logic preserves them when present.

Six Improvement actions cover every status, linked to `DEMO-IOP-217-GUIDE` and
an existing synthetic issue. The evaluated example retains three evidence records,
including a correction, and one server-calculated comparison using actual
2026-05-01/2026-08-31 observations with explicit coverage and attribution limits.
The asset remains Unverified with no source aliases or physical survey claim.

Four formal records dated 2026-10-20 demonstrate draft, published, closed and
closed/acknowledged states. Each uses an exact Workforce shift and three synthetic
journal snapshots. Closure preserves pending reports without resolving live issues.

Repeated apply reported zero schedule/assignment changes and all ten lifecycle
results unchanged; final inspection confirms the same counts. Original-data digest
remains `cb8e026e669b612bfedc7d6216061fe3a98a75ea63b90bfce2d7a8f4dadb0f70`.
All 104 analytical publications and 60,735 facts remain unchanged (frequency
316,864; 79,968,310 exact alarm seconds). The private manifest stays outside Git.
