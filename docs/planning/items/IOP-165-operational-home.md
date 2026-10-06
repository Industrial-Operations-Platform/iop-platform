# IOP-165 — Operational home and transitional access

## Status and goal

Completed locally, including the owner-requested login layout correction.
Requested by the owner on 2026-09-27 after accepting the existing
charts as Data Analysis v1. Continue local Docker demonstrations; company-funded
hosting and corporate identity integration remain later steps.

## Scope and acceptance

- [x] Record the owner's Data Analysis v1 acceptance and use Data Analysis as the
  product-facing module name; preserve existing OIP technical identifiers.
- [x] Populate Start with the selected user's available information and a live,
  authorized summary of existing Halle/sector analysis, with area drill-down.
- [x] Show clearly unavailable placeholders for weekly shifts and departments
  worked, technician publications, repairs, blocked and restored equipment.
  Missing information is not zero activity or evidence of equipment condition.
- [x] Replace local impersonation with temporary authenticated access behind the
  provider-independent identity boundary; keep stable users and history when a
  corporate provider becomes available. No corporate tenant is needed now.
- [x] Allow an authorized administrator to create local users and assign fixed
  permission bundles at explicit organization/site scope, with revocation and
  last-administrator protections. Use the owner-confirmed four-profile
  matrix; only Administrator imports in this increment.
- [x] Verify frontend states and server access controls, record evidence and keep
  the local operator guide synchronized with delivered behavior.

The owner confirmed Administrator, Technician, Task Force and Team Leader. Only
Administrator can import; the other three initially had identical capabilities.
Later IOP-171/184/194 define differences through explicit module permissions.
Existing accepted grants
remain governed by [ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md).

This original increment used explicit placeholders. IOP-168/184/194 now supply
real operational publishing, scheduling and Maintenance summaries through the
authorized sources; IOP-171 removes Technician analytical access.
Reuse scoped sector/Bereich classification, without turning analytical equipment
codes into validated assets or interpreting alarms as repair/blocking evidence.

## Dependencies and boundaries

Reuse the delivered analytical application, shared components and accepted
[hexagonal boundaries](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md) was accepted
on 2026-09-27 and governs the implemented local access mechanism. Related
parents remain IOP-007/028/031 (identity/administration), IOP-117 (role home),
IOP-050–059 (workforce), IOP-060–075 (handover/maintenance) and IOP-106 (provider).
This story selects a bounded increment, not completion of those entire modules.

## Evidence and remaining work

Follow-up completed: login and initial password change hide the workspace sidebar;
see the [login layout evidence](../completed/IOP-165-login-layout-plan.md).

[Completed home slice](../completed/IOP-165-operational-home-plan.md) and
[completed access plan](../completed/IOP-165-transitional-access-plan.md). Temporary
authentication, four profiles and administrator-created users are verified locally.
Docker is rebuilt, the initial administrator is issued with mandatory password
change, and imported history is unchanged. Corporate integration, remote hosting
remain deferred; operational records are delivered by IOP-168/184/194. No merge or
remote push is implied.
Data Analysis v1 acceptance does not create a tag, hosted deployment or shared-use
platform release; IOP-138 retains its separate gates.

## Current delivery — 2026-10-06

Four-profile account administration is delivered; profile capabilities are now
distinct. Start uses authorized Handover, Workforce and Maintenance sources.
Original local login/admin and role-home outcomes are reconciled as Completed in
IOP-028/031/117. Corporate identity and shared hosting remain open.
