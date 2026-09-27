# IOP-164 — Clarify hexagonal boundaries and remove obsolete artifacts

## Status and goal

Completed. Owner request: review and organize the API and web according to
hexagonal architecture, remove obsolete development artifacts, and remove root
`.local-*` directories only when unused. Follow Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [ADR-0034](../../architecture/adr/ADR-0034-local-container-platform.md).

## Scope and acceptance

- [x] Host composition and concrete adapters have explicit locations; domain and
  application dependencies remain inward, with executable boundary checks.
- [x] Remove the superseded fictional web preview and its exclusive tests/styles;
  preserve the connected workspace, API contracts and native debugging tools.
- [x] Clean generated API, web and database output on build so removed sources do
  not survive in `dist`; verify the resulting artifacts.
- [x] Inspect local installations without exposing credentials; remove only unused
  artifacts and preserve configuration associated with existing databases.
- [x] Update current documentation and validate types, unit, database and browser
  tests appropriate to the changes. No schema, public API or business-policy change.
- [x] Owner-approved follow-up: rebuild the local Docker application images, refresh
  API/web containers, verify health and preserve the existing database installation.

The owner also authorized merging the story into develop and pushing both branches
to origin.

## Evidence

[Execution plan](../completed/IOP-164-hexagonal-cleanup-plan.md).
[Local refresh](../completed/IOP-164-local-refresh-plan.md).
