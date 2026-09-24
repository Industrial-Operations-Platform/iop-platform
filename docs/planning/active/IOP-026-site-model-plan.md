# IOP-026 — Site model execution plan

Source: [IOP-026](../items/IOP-026-site-model.md).

## Status and authorization

In progress — owner requested IOP-026 on 2026-09-24, limited to
[POC scope](../../product/scope-poc.md) and [delivery](../poc-delivery.md).
Branch: `docs/IOP-026-site-model`, created from clean `develop` before edits.

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
- [ ] Site migration/seed and relevant positive/negative tests pass.
- [ ] Item/backlog synchronized and finished plan moved to completed.

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
