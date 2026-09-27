# IOP-149 — Containerized local platform and historical seed

Status: Completed

## Requested outcome

Run frontend, backend and PostgreSQL as separate local Docker Compose services.
Use the owner's backup analytics facts and referenced catalogs as a repeatable
local seed, preserving exact measures and sector classification. Continue daily
CSV uploads against persistent storage. Application composition must not live in
a demo feature directory.

Reports expose subtle collapsible filters: dates only in Executive Overview and
Halle, sector/area in Bereich, and progressively richer equipment/error/time views.
Grouping remains independent from filtering; changing views removes incompatible
filters. Preserve the established visual identity and executive-only KPIs.

## Acceptance

- [x] Three container services provide the working application locally.
- [x] Backup analytics history reconciles exactly and repeated starts do not duplicate it.
- [x] Backup data and credentials stay outside Git and image build contexts.
- [x] Application composition has neutral naming and preserves hexagonal boundaries.
- [x] Progressive filters and drill-down work without hidden stale constraints.
- [x] Database, API and browser checks cover seed persistence and report behavior.

References: [IOP-148](IOP-148-analytical-workspace.md),
[backup reference](../../architecture/wincc-backup-reference.md),
[plan](../completed/IOP-149-local-stack-history-plan.md).
