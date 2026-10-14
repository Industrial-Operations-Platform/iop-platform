# IOP-032 — Asset hierarchy model

## Status and goal

Completed. Configurable composition without hard-coded hierarchy levels.

## Delivered scope — 2026-10-14

The site type catalog controls containment capabilities. Each scoped asset has one optional parent; physical location and controller connections remain separate. The inventory and model editor expose parent relationships and retain immutable history.

The owner explicitly authorized this implementation in
[IOP-209](IOP-209-asset-domain-completion.md) under the
[IOP-203](IOP-203-platform-completion.md) delegated completion request.
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) is Accepted
under that authorization. Historical Proposed decisions are not accepted by inference.

## Acceptance and evidence

- [x] Configurable composition without hard-coded hierarchy levels.
- [x] Planned scenarios, scoped contracts, decisions and working UI/API are documented.
- [x] Domain/HTTP, frontend and disposable PostgreSQL evidence is recorded in the
  [completed IOP-209 plan](../completed/IOP-209-asset-domain-completion-plan.md).

The PostgreSQL cases include 1,506 scoped identities, pagination/refinement,
current-role denial, scope/RLS, concurrency, cycle/controller invariants,
immutable mapping history, unchanged RAW/facts and atomic rollback. Synthetic
cases establish software behavior rather than plant acceptance.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md), [IOP-026](IOP-026-site-model.md)

## Remaining external inputs and boundaries

Operating teams still need to record the actual plant composition.

Administrator, Team Leader and Task Force use current Assets permissions; source
analytics authorization is checked independently. Customer vocabulary remains
configuration; physical placement is Locator-owned. See the
[Asset domain guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).
