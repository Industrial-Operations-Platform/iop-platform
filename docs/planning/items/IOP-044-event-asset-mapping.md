# IOP-044 — Event-to-asset mapping

## Status and goal

Completed. Explicit reviewed source-to-canonical links for published OIP facts.

## Delivered scope — 2026-10-14

Assets owns exact original source tuples and versioned reviews. OIP materializes canonical links during import publication and review changes on the same pinned transaction. Pending, Ambiguous, Rejected, Unmapped and not-yet-prepared coverage remain explicit. Projection/history failure rolls back the review. RAW bytes, original facts and provenance are unchanged; source wording never creates an asset.

The owner explicitly authorized this implementation in
[IOP-209](IOP-209-asset-domain-completion.md) under the
[IOP-203](IOP-203-platform-completion.md) delegated completion request.
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) is Accepted
under that authorization. Historical Proposed decisions are not accepted by inference.

## Acceptance and evidence

- [x] Explicit reviewed source-to-canonical links for published OIP facts.
- [x] Planned scenarios, scoped contracts, decisions and working UI/API are documented.
- [x] Domain/HTTP, frontend and disposable PostgreSQL evidence is recorded in the
  [completed IOP-209 plan](../completed/IOP-209-asset-domain-completion-plan.md).

The PostgreSQL cases include 1,506 scoped identities, pagination/refinement,
current-role denial, scope/RLS, concurrency, cycle/controller invariants,
immutable mapping history, unchanged RAW/facts and atomic rollback. Synthetic
cases establish software behavior rather than plant acceptance.

## Dependencies

[IOP-043](IOP-043-canonical-event-model.md), [IOP-037](IOP-037-asset-aliases.md), [IOP-039](IOP-039-asset-survey.md)

## Remaining external inputs and boundaries

Real source-to-physical-identity decisions require the operating team. The delivered mapping infrastructure does not approve the plant catalog.

Administrator, Team Leader and Task Force use current Assets permissions; source
analytics authorization is checked independently. Customer vocabulary remains
configuration; physical placement is Locator-owned. See the
[Asset domain guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).
