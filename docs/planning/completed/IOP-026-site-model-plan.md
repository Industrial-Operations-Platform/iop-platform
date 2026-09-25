# IOP-026 — Site model execution plan

Source: [IOP-026](../items/IOP-026-site-model.md).

## Status and authorization

Completed — POC implementation slice finished on 2026-09-25. The parent is Deferred
for remaining lifecycle/admin scope. Owner requested IOP-026 on 2026-09-24, limited to
[POC scope](../../product/scope-poc.md) and [delivery](../poc-delivery.md).
Implementation branch: `feature/IOP-026-site-model`, from clean `develop`.
Earlier design branch: `docs/IOP-026-site-model`, also created from `develop`.
Proposal sections below preserve the earlier design/integration evidence.

## Scope and dependencies

Persist one explicitly configured site owned by an existing organization, with a
validated IANA zone. No CRUD, selectors, lifecycle UI, source seed or runtime access.
IOP-025's organization seed and IOP-019 migration tooling are integrated on develop;
IOP-008 temporal design is Accepted. No prerequisite branch integration is needed.

ADR-0020 authorizes privileged initial creation only for organizations. Extending
that exception to sites needs a bounded Proposed decision under AGENTS.md rule 5.
Prepare ADR-0021 before dependent implementation. ADR-0018 remains Proposed and
independently gates runtime business access; it does not block this proposal.

## Files expected to change

- This plan, retained in active while the decision is pending.
- `docs/architecture/adr/ADR-0021-local-site-bootstrap.md`: concrete proposal.
- `docs/planning/items/IOP-026-site-model.md`: scope, dependencies and blocker.
- `docs/planning/backlog.md`: mirrored story status.

After acceptance, update this plan before editing migrations, seed command/CLI,
database tests, npm/Compose command wiring and local database instructions. Do not
alter applied migrations or the accepted architecture baseline during proposal work.

## Database, API and UI impact

Proposal only now. Proposed storage is `platform_core.sites` with organization FK,
scoped candidate key, forced RLS and explicit insert-only migrator seed. Runtime
retains CONNECT only. No endpoint, application DB connection or UI is planned.

## Steps and validation

1. Verify integrated dependencies, accepted boundaries and existing configuration.
2. Specify seed authority, ownership, identity, zone validation and conflict rules.
3. Review missing/foreign scope, nonexistent owner, concurrent conflicting seeds,
   invalid zones and immutable existing configuration as design scenarios.
4. Check relative links, IDs, mirrored statuses and `git diff --check`; commit the
   documentation increment. Ask for decision acceptance and publication separately.
5. Only after acceptance, implement and run `npm test`, typecheck and database
   tests on disposable PostgreSQL, plus native/Compose reproduction. Record actual
   evidence before completing the POC slice; defer broader parent scope explicitly.

## Completion checklist

- [x] Proposal and documentation checks completed; local commit prepared.
- [x] Owner accepts the site bootstrap authority.
- [x] Site migration/seed and relevant positive/negative tests pass.
- [x] Item/backlog synchronized and finished plan moved to completed.

## Evidence and deviations

Initial inspection: working tree clean, branch `develop`; organization implementation
present. No active IOP-026 plan existed. Git branch creation required sandbox
escalation and succeeded. No application or database changes made.

Proposal validation on 2026-09-24: all 160 relative links across the four changed
Markdown files resolved; item/backlog both Blocked and ADR-0021 Proposed.
`git diff --check` passed; `git merge-base --is-ancestor develop HEAD` passed.
Reviewed the proposal against existing seed/configuration code and Accepted
ADR-0012/0013/0016/0019/0020. The validation scenarios include positive creation,
missing/foreign/sibling scope, nonexistent owner, conflicting concurrent seed and
zone/name mutation rejection. These are design expectations, not executed tests.
No runtime tests were run because this increment changes documentation only.
The plan remains active because implementation awaits the explicit site bootstrap
decision; the parent and POC slice are not complete. No scope deviation.

## Owner acceptance and integration increment

On 2026-09-24 the owner answered yes to ADR-0021 acceptance and explicitly requested
commit, merge into the integration branch and publication to origin. `dev` resolves
to the existing `develop` branch. Record Accepted status in ADR-0021, synchronize
item/backlog to In progress, and add the accepted boundary to ARCHITECTURE.md.
Validate links, statuses and whitespace, commit on the story branch, fetch origin,
then merge and publish the story and develop without force or branch deletion.
This increment integrates the accepted design; implementation remains pending and
the plan stays active. ADR-0018 remains Proposed. No runtime tests are applicable.

## Implementation increment — 2026-09-25

Owner requested continuation within the same POC boundary. Branch:
`feature/IOP-026-site-model`, created from clean `develop` before edits.
ADR-0021 is Accepted and all direct dependencies (IOP-025/008/018/019) are
integrated; their contexts are English, so no translation edits are needed.
The earlier proposal-only steps above are historical evidence.

Implement the accepted site table, invoker zone trigger, forced two-selector RLS
and explicit insert-only seed. Preserve immutable applied migrations and runtime
CONNECT-only privileges. No API/UI, business grants or adjacent story work.

Expected files: new site SQL migration, `infra/database/seed-site.ts`, database CLI,
`package.json`, `compose.database.yaml`, `.env.example`, database tests (including
migration-count expectations), database README, ARCHITECTURE.md, data-model.md,
this plan, IOP-026 item and backlog. Change other startup docs only if their existing
statements become stale due to this slice.

Steps: implement storage/seed/wiring; add input, concurrency, ownership, RLS,
constraints, rollback and actual-role denial checks from ADR-0021; run typecheck,
`npm test`, database tests and disposable native/Compose reproduction. Verify links,
statuses and whitespace, record actual evidence, defer remaining parent lifecycle/
CRUD scope, move this plan to completed and commit locally. Publication requires
fresh explicit authorization for this implementation branch.


## Implementation evidence and outcome

Implemented the exact ADR-0021 boundary: site migration and invoker catalog trigger,
scoped SELECT/INSERT RLS, explicit validated insert-only seed, native/Compose wiring,
configuration example and operating instructions. Applied migrations were preserved.
The item/backlog now defer broader parent scope; this completed plan closes only
POC storage/bootstrap. ADR-0018 remains Proposed; no runtime grants or API/UI changes.

Validation on 2026-09-25 used Node 24.21.0/npm 10.9.2 from
`/private/tmp/iop-017-runtime/node_modules/.bin` and PostgreSQL 17.6:

- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: build and browser contract passed; 59 API, 11 web and 62 database
  configuration/CLI tests passed.
- `npm run test:database`: 84 tests across four suites passed, using actual role
  logins, recreated empty databases and native CLI execution. Site tests cover
  concurrent equal/conflicting owner/name/zone, invalid input/direct SQL, exact
  catalog spelling disagreement, Unicode, forced RLS, sibling isolation, scoped FK,
  transaction cleanup, rollback, role drift, safe errors and runtime denial.
- Disposable Compose project `iop026-check-7f9bcd461b`: configuration/build,
  provisioning, three migrations, organization/site creation and repeat commands
  passed (`0 applied`, `unchanged`). Test container, volume and network were removed;
  no operator volume was used.

Initial attempts exposed the shell's unsupported Node 20 and sandbox-denied test
ports/Docker access; reruns used the required existing Node 24 toolchain with allowed
local access. A real concurrent insert test exposed contention on the composite
unique key as well as the primary key. The seed now handles either uniqueness
conflict with DO NOTHING and separately verifies the committed scoped row; no update
is performed. This is a correction within ADR-0021, not a new architectural pattern.

Documentation validation passed: 213 relative Markdown links resolved; item/backlog
Deferred status, completed plan location, ADR-0018 Proposed status, branch ancestry
and `git diff --check` were verified. No scope expansion or dependency translation was necessary. Business
RBAC, runtime pools and production operation are not validated by this slice.
