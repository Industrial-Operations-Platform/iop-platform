# IOP-165 — Transitional access implementation

Status: Blocked on acceptance of [ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
Authorized product scope: [IOP-165](../items/IOP-165-operational-home.md).
Prepared on `feature/IOP-165-operational-home`, from develop. The completed
[home slice](../completed/IOP-165-operational-home-plan.md) is independent.

## Scope and next steps

The owner confirmed four profiles; only Administrator imports. Technician, Task
Force and Team Leader have identical permissions for now. The temporary login and
session mechanism is still Proposed. No authentication code or schema is changed.

After acceptance, specify migrations/privilege lookup, API DTOs and transaction
contracts before dependent edits. Expected areas are `apps/api/src/modules/`
(Authentication and Users/RBAC), host composition/controllers, `infra/database/`
migrations/provisioning, web identity/admin adapters and operator documentation.
Extract platform navigation composition from the analytical React adapter when
adding independently owned authentication/administration features; keep inward
application ports free of provider/UI dependencies.

Implement local accounts, sessions, explicit bootstrap, administrator-created users
and scoped assignment changes under ADR-0035. Replace selector behavior only in the
new explicitly enabled mode. Preserve stable users, provenance and existing local
data through migration. Do not activate a corporate tenant or publish the stack.

## Validation

Run type checks, `npm test`, real PostgreSQL migration/RLS and browser scenarios.
Cover initial-secret change, login/logout/revocation, direct denied imports for all
three non-admin profiles, scoped grants, foreign identity/reset denial, concurrent
last-admin changes and user/history continuity. Record actual results before closure.

## Resume and closure

This plan awaits an architectural decision required by ADR-0007, not further
authorization for the already-requested features. Before resuming, verify branch
state and the owner's integration of the completed slice; do not silently merge.
Update IOP-165/backlog and archive this plan only after access acceptance is met.
