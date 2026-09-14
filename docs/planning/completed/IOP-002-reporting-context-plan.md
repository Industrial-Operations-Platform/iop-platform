# IOP-002 — CSV and reporting context plan

## Status and authorization

Completed — evidence-capture slice only. The owner supplied a CSV excerpt and four Power BI screenshots and
requested progress on IOP-002 plus relevant backlog context updates. Documentation
only, on `docs/IOP-002-reporting-context`, created from `develop`.

## Scope and files

Capture evidence in `docs/product/csv-and-reporting-reference.md`; update the
IOP-002 technology-stack context and backlog index. Add focused context to items
IOP-043, IOP-045, IOP-049, IOP-090, IOP-091, IOP-092, IOP-095, IOP-096 and IOP-097.
These are linked refinements of this requested evidence capture, not activation of
those implementation stories. Preserve their statuses and existing scope.

## Dependencies and decisions

Read AGENTS.md, ARCHITECTURE.md, the IOP-002 context and ADR-0005–0008.
ADR-0006 remains Accepted. No frontend/chart library choice or new ADR is implied.
IOP-001 remains open for report definitions and pilot acceptance. Its unmerged
persona-validation branch remains intact; this independent slice requires no merge.

## Steps and validation

1. Record observed columns and charts separately from interpretation and unknowns.
2. Link source-grain, mapping, KPI and drill-down implications to relevant items.
3. Check local Markdown links, diff whitespace, statuses and documentation-only scope.
4. Record evidence, archive this finished slice and create a local commit.

No database, API, UI or executable code changes. No runtime test runner exists.
Do not copy customer rows, equipment identifiers or screenshots into repository data.
Do not push or merge this increment without authorization.

## Completion evidence

Captured source structure, four observed report pages, analytical navigation and
open validation points. Linked nine proposed ingestion/analytics contexts and
updated IOP-002 plus the backlog. No technology decision, application code,
customer dataset, merge or push was added. IOP-002 remains In progress.

Validation: `git diff --check` and a local Markdown-link existence check over all
changed/new Markdown files passed. Review confirmed unchanged related-item
statuses and documentation-only scope. No runtime tests apply.
