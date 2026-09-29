# IOP-171 — Restrict Technician analytical access

## Status and authorization

Completed locally. The owner explicitly confirmed on 2026-09-29 that Technician must not
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
The independent implementation starts from develop. IOP-169 and IOP-170 remain
unpublished review branches; integrating them requires the already requested publication
approval. Their eventual integration must retain the Technician restriction in View as
and authorize the bounded handover equipment catalog through handover access rather
than requiring access to analytical reports.

## Evidence and publication

See the [completed execution plan](../completed/IOP-171-technician-access-plan.md).
Code, migration and isolated browser/database checks are complete. Publishing and
applying the migration to the running Docker stack still require owner approval.
