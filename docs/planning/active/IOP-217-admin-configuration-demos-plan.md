# IOP-217 — Execution plan

In progress. [Owner request and acceptance](../items/IOP-217-admin-configuration-demos.md).
Branch: `feature/IOP-217-admin-configuration-demos`, created from clean `develop`.

## Changes and steps

1. Audit current role/grant checks and configuration navigation. Users/RBAC owns
   profile authority; owning application/persistence adapters enforce configuration
   writes and catalogs; host composes permission-aware module access. Restrict
   Integrations, Asset registration/enrichment/mapping, Locator configuration and
   other exposed site setup while preserving operational reads/contributions.
   Expected files: relevant `apps/api/src/modules/`, `apps/api/src/host/`,
   `apps/web/src/host/`, affected feature adapters and their permission tests.
   Add a forward `infra/database/migrations/` revocation for existing non-admin
   configuration grants; keep historical migrations immutable. Guard Workforce,
   Maintenance and reporting configuration against stale grants as well.
   Password-authenticated import administration must also check current
   Administrator authority; preserve the explicit trusted native import adapter
   using an authentication-mode option at host composition.
   Preserve native browser access for actual scoped Administrators by projecting
   their current stored profile into session/selector responses; never infer
   Administrator authority from an import grant for a profileless CLI operator.
   Local activation revealed an already-applied historical permission migration
   missing from develop: `20261014090000-administrator-assets-locator.sql`.
   Restore its exact source from commit `f737191` solely to reconcile installed
   history with strict migration ordering, and include its name in the bounded
   demo-maintenance allowlist. Do not merge the IOP-211 branch, rewrite migration
   history or replay the already-applied change. Its two permission revocations
   match the owner's current configuration restriction.
2. Add bounded, rerunnable local scenario tooling in `scripts/local/` for
   Improvement Tracking, exact Workforce-bound Formal Handover and all-user
   weekly planning (2026-10-19–2026-10-25). Enumerate active site users; use
   existing module applications and authorization, retain private manifests,
   preserve existing records, and explicitly label synthetic evidence.
   Existing known synthetic registry identities are retired, so create one stable,
   explicitly synthetic Unverified identity through Administrator Asset registration
   for the Improvement linked-asset exercise; preserve retired originals.
   Treat retained Workforce deletions as authoritative during preparation and
   repeated application; do not recreate tombstoned schedules or assignments.
3. Preview, apply and inspect the local demonstration using the existing runtime.
   Add necessary script checks, operation instructions and package commands.
4. Synchronize affected permission contracts, architecture/ADR refinements and
   execution evidence; finish item/backlog and commit locally. Relevant dependency
   stories read so far (204/205/207/209/215) are already English; no translations.
   Synchronize `ARCHITECTURE.md`, ADR-0039, the Asset composition contract,
   product Asset/Integration/Maintenance permission contracts and operation guides.
   Link the bounded synthetic scenario guide from `platform-completion.md`.

## Validation and evidence

Planned: current-profile/grant denial tests, operational access regressions,
scenario/rerun checks, `npm test` (including API), typecheck/build/contracts/design
and architecture guards, documentation links/status consistency, actual persisted
demo and complete weekly roster inspection. Inspect desktop/narrow browser
navigation for Administrator and other current profiles. Record actual commands,
counts and material limitations before closure.

Passed so far: repository typecheck; API/web/database image builds; browser
contract drift check; 77 database configuration checks; full script suite (37
checks, including 10 operational scenario tests); 18 focused Playwright scenarios;
full API suite (50 suites, 531 checks); 68 focused real PostgreSQL checks, followed
by 15 checks with restored historical migration inventory.
Full web unit run covered 235 checks: two five-second timing failures under
parallel builds both passed unchanged in the focused rerun (3/3). Desktop and
390px screenshots were inspected for Administrator and operational previews.
The local permission migration applied with strict ordering and no historical
replay. Startup diagnostic passed after the heavy test processes finished; final
standard local setup verification and demonstration application remain in progress.

## Closure

Move this plan to `completed/`, update the item and backlog, record commit hashes
and clean working-tree status. Request publication only after the result is
reviewable, naming story/develop and origin under the owner's convention.
