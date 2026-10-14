# IOP-039 — Asset survey workflow

## Status and goal

In progress. Pending/Validated/Rejected software reviews with attributed notes and evidence.

## Delivered scope — 2026-10-14

The implemented workflow is independent of registry lifecycle. Validation/rejection requires notes and an evidence reference; immutable history records the reviewer and time. API/editor and opt-in synthetic examples exercise all three decisions.

The owner explicitly authorized this implementation in
[IOP-209](IOP-209-asset-domain-completion.md) under the
[IOP-203](IOP-203-platform-completion.md) delegated completion request.
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) is Accepted
under that authorization. Historical Proposed decisions are not accepted by inference.

## Acceptance and evidence

- [x] Pending/Validated/Rejected software reviews with attributed notes and evidence.
- [x] Planned scenarios, scoped contracts, decisions and working UI/API are documented.
- [x] Domain/HTTP, frontend and disposable PostgreSQL evidence is recorded in the
  [completed IOP-209 plan](../completed/IOP-209-asset-domain-completion-plan.md).
- [ ] Actual plant inspection and authentic evidence accepted by operators.

The PostgreSQL cases include 1,506 scoped identities, pagination/refinement,
current-role denial, scope/RLS, concurrency, cycle/controller invariants,
immutable mapping history, unchanged RAW/facts and atomic rollback. Synthetic
cases establish software behavior rather than plant acceptance.

## Dependencies

[IOP-034](IOP-034-asset-lifecycle.md)

## Remaining external inputs and boundaries

Physical inspection, authentic evidence and operator acceptance for the real plant remain pending. Software review is complete and does not establish a completed physical survey.

Administrator, Team Leader and Task Force use current Assets permissions; source
analytics authorization is checked independently. Customer vocabulary remains
configuration; physical placement is Locator-owned. See the
[Asset domain guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).
