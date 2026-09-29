# IOP-171 — Restrict Technician analytical access

## Status and authorization

Completed. The owner explicitly confirmed on 2026-09-29 that Technician must not
have access to Data Analysis. Administrator, Task Force and Team Leader retain it.

## Acceptance

- Hide Data Analysis navigation, Start shortcuts and analytical summaries for Technician;
  do not issue analytical requests from that profile's home.
- Enforce denial through current scoped API permissions, including existing accounts.
  Creation, profile changes and restoration must not grant Technician analytics access.
- Preserve login/session context and Shift Handover reading/contribution. Return a
  server-derived analytical capability for the UI; browser labels do not authorize access.
- Test authorization, an existing technician's grant upgrade, unaffected other profiles,
  operational home and direct API denials. Preserve accounts and historical records.

The owner decision refines [ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md)
using existing permissions under [ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md).
Implementation began independently from develop, then the owner approved integration
with IOP-169/170 and publication. Technician layout preview retains this restriction;
the bounded handover equipment picker remains available through scoped handover access.

## Evidence and publication

See the [completed execution plan](../completed/IOP-171-technician-access-plan.md).
The integrated code is published to origin and running in local Docker. The migration
is applied: Technician has handover access and no analytical grant. All existing accounts
and historical data were preserved. See the
[combined publication record](../completed/IOP-171-integrated-publication-plan.md).
