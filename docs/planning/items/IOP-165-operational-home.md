# IOP-165 — Operational home and transitional access

## Status and goal

Completed locally on 2026-09-27. Requested by the owner on 2026-09-27 after accepting the existing
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
Administrator can import; the other three currently have identical capabilities.
Differences will be defined when further modules exist, not inferred from job labels.
Existing accepted grants
remain governed by [ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md).

Real operational publishing, maintenance lifecycles and shift scheduling are future
increments; this initial home uses placeholders where those sources do not exist.
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

[Completed home slice](../completed/IOP-165-operational-home-plan.md) and
[completed access plan](../completed/IOP-165-transitional-access-plan.md). Temporary
authentication, four profiles and administrator-created users are verified locally.
Docker is rebuilt, the initial administrator is issued with mandatory password
change, and imported history is unchanged. Corporate integration, remote hosting
and real operational records remain deferred. No merge or remote push is implied.
Data Analysis v1 acceptance does not create a tag, hosted deployment or shared-use
platform release; IOP-138 retains its separate gates.
