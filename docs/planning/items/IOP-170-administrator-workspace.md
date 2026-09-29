# IOP-170 — Administrator workspace and profile views

## Status and request

Completed locally. The owner requested administration to be active and visible by default,
with a deliberate **View as** control listing the available profiles instead of a
single Taskforce toggle.

## Scope and acceptance

- Administrators land on a platform administration overview, with existing user,
  import, source-file, preparation and KPI tools immediately discoverable.
- Administration remains available during normal navigation. Operational analytics
  remains directly accessible without switching the account's mode.
- View as lists Administrator, Technician, Task Force and Team Leader. Selecting an
  operational profile shows its workspace layout, hides administration shortcuts,
  labels the preview and provides a return to administration.
- Preview is presentation only: retain the authenticated identity, server permissions,
  data scope and authorship. No impersonation endpoint or grant mutation.
- Non-administrators do not receive the selector or administrative tools. Actual
  session capabilities continue to gate each administrative entry point.
- Reuse shared components and verify default, navigation, preview and session reset.

This refines [IOP-167](IOP-167-users-administration-mode.md) under accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
IOP-169 remains on its separate unpublished review branch; it is not a prerequisite.

## Evidence and publication

See the [completed execution plan](../completed/IOP-170-administrator-workspace-plan.md).
The local branch is ready for review. Publication, integration with the separate
IOP-169 handover branch and updating the running Docker stack remain unapproved.
