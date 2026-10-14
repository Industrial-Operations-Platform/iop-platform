# IOP-093 — Pareto views

## Status and goal

Completed. Area, canonical Asset and Event Pareto with complete-total denominators.

## Delivered scope — 2026-10-14

Existing source-grouping Pareto covers area/equipment/event. IOP-209 adds OIP-owned canonical Asset frequency/alarm-seconds Pareto for explicit half-open reporting-date periods. Full, mapped and unresolved totals, mapping states, missing/admitted dates and projection revision preserve coverage. Limited visible groups use the complete admitted source denominator.

The owner explicitly authorized this implementation in
[IOP-209](IOP-209-asset-domain-completion.md) under the
[IOP-203](IOP-203-platform-completion.md) delegated completion request.
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) is Accepted
under that authorization. Historical Proposed decisions are not accepted by inference.

## Acceptance and evidence

- [x] Area, canonical Asset and Event Pareto with complete-total denominators.
- [x] Planned scenarios, scoped contracts, decisions and working UI/API are documented.
- [x] Domain/HTTP, frontend and disposable PostgreSQL evidence is recorded in the
  [completed IOP-209 plan](../completed/IOP-209-asset-domain-completion-plan.md).

The PostgreSQL cases include 1,506 scoped identities, pagination/refinement,
current-role denial, scope/RLS, concurrency, cycle/controller invariants,
immutable mapping history, unchanged RAW/facts and atomic rollback. Synthetic
cases establish software behavior rather than plant acceptance.

## Dependencies

[IOP-090](IOP-090-event-frequency.md)

## Remaining external inputs and boundaries

Actual canonical mapping reviews remain operating-team data. Frequency aggregates are not individual incidents, alarm seconds are not downtime, and ranking does not establish causality.

Administrator, Team Leader and Task Force use current Assets permissions; source
analytics authorization is checked independently. Customer vocabulary remains
configuration; physical placement is Locator-owned. See the
[Asset domain guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).
