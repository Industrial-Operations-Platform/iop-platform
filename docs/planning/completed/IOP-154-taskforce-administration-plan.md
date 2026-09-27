# IOP-154 — Taskforce and administrative presentation

Status: Completed
Branch: `feature/IOP-154-taskforce-administration`, from clean develop at `d8cbe52`.
Item: [IOP-154](../items/IOP-154-taskforce-administration.md).

## Scope and execution

1. Reuse Accepted ADR-0031/0032/0033 boundaries. Add source-row and message-catalog
   domain/use-case ports and PostgreSQL adapters with current grants and exact scope.
   Reuse the relational read projection; keep row sorting server-owned and stable
   across pages. Catalog pagination must not silently omit messages beyond the
   existing report option limit. No database migration or authentication change.
2. Reuse shared native Select styling for whole-field month/message dropdowns.
   Month choices come from imported reporting dates. Exclude other selected KPI
   messages and derive the default card label from its chosen Meldetext.
3. Add empty Start navigation and default Taskforce mode. An authorized
   Administrator toggle exposes import, preparation, file review and KPI editing;
   this is a presentation mode, never a replacement for server authorization.
4. Extract contributing rows from analytical reports into a file review component
   in administration. Header clicks cycle ascending, descending, off; multiple
   active criteria retain click order and show priority. No extra sort buttons.
   Use human-readable context labels instead of deployment identifiers.
5. Update generated contracts, targeted domain/component tests, PostgreSQL and real
   browser journeys. Rebuild the local stack and inspect desktop/mobile screens
   without altering its historical data. Synchronize canonical guides and evidence.
6. Commit validated changes on this branch. Publishing requires new owner approval.

Expected files: host DTO/controller/composition, OIP domain/application/PostgreSQL,
frontend analysis models/application/HTTP/React and shared components, associated
unit/integration tests, generated contracts and canonical scope/design/planning docs.

## Validation and outcome — 2026-09-27

- `npm test`: builds, generated contract check, API 284 tests, frontend 45,
  database configuration 77 and script tests 18 passed. Final web build and its
  45 tests passed again after Start-page/default-selection refinements.
- `npm run test:database`: 12 suites / 175 tests passed. The additional PostgreSQL
  case imports 235 rows/messages in an isolated source, verifies all six sort
  fields, combined sorting across five pages, source-line tie ordering, catalog
  cursor completeness, reader denial, foreign-source isolation and stale revisions.
  The real browser journey covers Start, explicit admin entry, dropdowns, per-file
  three-state sorting and returning to Taskforce with tools/rows absent.
- Local `npm run local:up` and a final web-only rebuild succeeded. Database/API/web
  are healthy; the seed reconciled 42,220 rows, frequency 212,411 and 56,391,042
  exact seconds across 78 dates, with zero imports and 78 unchanged dates.
- Read-only browser verification against that existing history passed: three month
  options, four current KPIs excluded from 155 available choices, file browsing
  (681 rows / 14 pages), all six sortable headers, next-page retrieval and rows
  absent from all six report templates. Start/default Taskforce, mode switching
  and reload passed without browser errors. Widths 1440/1024/768/390 had no page
  overflow; screenshots of Start, reports, KPI controls and file tables were
  reviewed. No settings were saved or data imported by this local visual check.
- Shared presentation dependency checks, whitespace and canonical Markdown links
  checked. Updated scope, operator guide, API guide, component/identity reference
  and delivery status. No new dependency, migration or architectural pattern.

The existing report API retains legacy row fields for compatibility; only the
administrative file view renders contributing source rows. Taskforce is a default
presentation mode, not identity impersonation or a new permission boundary. File
history retains its existing 1,000-attempt window and displays that limit when full.
Source-row sorting uses the whole selected file, stable line ties and current
prepared values; immutable originals remain downloadable under existing grants.
IOP-130 usefulness acceptance remains open. Publication requires owner approval.
