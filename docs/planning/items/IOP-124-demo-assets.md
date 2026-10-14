# IOP-124 — Synthetic asset structure

## Status and goal

Completed. Opt-in clearly fictional asset composition, controller, metadata and survey exercises.

## Delivered scope — 2026-10-14

The reusable local fixture creates four fresh labelled synthetic identities under an existing configured scoped location, adds dedicated synthetic types and parent/controller links, and exercises all survey decisions plus Pending ambiguous mapping. Frozen local manifest supports repeat safety; user edits are preserved. No existing registry identity is approved and no RAW event is fabricated.

The owner explicitly authorized this implementation in
[IOP-209](IOP-209-asset-domain-completion.md) under the
[IOP-203](IOP-203-platform-completion.md) delegated completion request.
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) is Accepted
under that authorization. Historical Proposed decisions are not accepted by inference.

## Acceptance and evidence

- [x] Opt-in clearly fictional asset composition, controller, metadata and survey exercises.
- [x] Planned scenarios, scoped contracts, decisions and working UI/API are documented.
- [x] Domain/HTTP, frontend and disposable PostgreSQL evidence is recorded in the
  [completed IOP-209 plan](../completed/IOP-209-asset-domain-completion-plan.md).

The PostgreSQL cases include 1,506 scoped identities, pagination/refinement,
current-role denial, scope/RLS, concurrency, cycle/controller invariants,
immutable mapping history, unchanged RAW/facts and atomic rollback. Synthetic
cases establish software behavior rather than plant acceptance.

## Dependencies

[IOP-123](IOP-123-demo-organization.md), [IOP-039](IOP-039-asset-survey.md)

## Remaining external inputs and boundaries

This fixture supports the configured hall/area location context. It does not represent actual plant geometry, a physical survey or production sensor associations.

Administrator, Team Leader and Task Force use current Assets permissions; source
analytics authorization is checked independently. Customer vocabulary remains
configuration; physical placement is Locator-owned. See the
[Asset domain guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).
