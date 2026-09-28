# IOP-167 — Restrict user management to administration mode

## Status and goal

Completed. Requested by the owner on 2026-09-28: administrators viewing normal
analytics or Taskforce view must only see Users & profiles in administration mode.

## Scope and acceptance

- [x] Hide Users & profiles navigation and content outside administration mode.
- [x] Keep user management available to authorized administrators in administration
  mode; returning to Taskforce view removes the user management panel.
- [x] Preserve permission checks and normal analytical navigation.

This is a workspace presentation correction to
[IOP-165](IOP-165-operational-home.md), within accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
No API, permissions or persistence changes are required.

## Evidence and remaining work

See the [completed execution plan](../completed/IOP-167-users-administration-mode-plan.md).
The owner-approved Docker update and publication preparation are recorded in the
[local update plan](../completed/IOP-167-local-publication-plan.md).
