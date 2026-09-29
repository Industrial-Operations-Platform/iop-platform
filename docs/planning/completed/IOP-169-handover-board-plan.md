# IOP-169 — Handover board implementation

Status: Completed locally, 2026-09-29.
Branch: `feature/IOP-169-handover-board`, from develop `8575856`.
[Scope and acceptance](../items/IOP-169-handover-board.md).

## Steps and files

1. Extend handover application rules: server-local date for contributors, own-entry
   query, atomic follow-up/state, scoped equipment lookup/validation port. Reuse
   analytical lookup adapters through host composition without cross-module SQL.
2. Extend HTTP contracts and regenerate browser bindings. Preserve old references
   on unchanged corrections and retain all revision evidence.
3. Add a generic accessible dialog to shared design components. Build category
   panels and compact controls; creation/search/follow-up use dialogs. Keep matrix,
   meeting and personal history consistent with server-paginated results.
4. Refine Start operational composition and replace the bare analytical table with
   a concise summary. Use explicit pending/overdue/blocked priorities, not inferred
   equipment health. Keep both data sources independent.
5. Test API rules and architecture, contracts, real PostgreSQL integration and
   Playwright journeys at desktop/mobile widths. Update operator/product docs,
   item/backlog, archive this plan and commit coherent validated changes.

Expected paths: API handover domain/application/adapter, host composition/contracts,
OIP reference lookup adapter if needed; web handover feature and Start host/analysis
presentation; shared components; API/web/database tests and generated contracts;
this plan, story/backlog, product and operator guide, ADR-0036 clarification.

## Validation

Run Node 24 typecheck, npm test, contract generation/check and build. Exercise
current-day authorization, lookup scope and invalid-code rejection, full own-entry
pagination, atomic closure and history. Browser checks cover category defaults,
modal focus/Escape, hidden search, department switches, state follow-up/resolution,
Start pending priority, empty/error states and narrow overflow. Use disposable DB
fixtures; preserve the operator's reports/accounts and running stack.


## Delivery and evidence

- Implemented the configured category board (three recent previews per category,
  independent complete counts), modal creation/search/correction/follow-up, shared
  department selection, own-entry history, matrix and date-based meeting views.
- Server checks current site date for contributor creation, exact imported equipment
  selection and current permissions. Follow-up can resolve/reopen in the same
  transaction as its attributed revision; the current projection retains the latest
  note while original content remains unchanged. No schema migration was needed.
- Imported-code lookup uses the existing pinned transaction: handover owns the port,
  host maps operational IDs to source labels and checks analytical access, OIP owns
  its SQL. No nested connection acquisition or analytical foreign keys were added.
  Earlier unchanged references remain valid when correcting retained evidence.
- Start prioritizes pending and attention reports with full scoped counts, compact
  previews and links. Attention means blocked or overdue action/feedback, not a
  guessed live equipment state. Highlights remain site-wide and analytics compact.
- `npm run typecheck`, production builds and `npm test` passed with Node 24.21.0.
  The full test run passed secret tooling 18, API 324, web 66 and database configuration
  77; after adding the timezone boundary test, the final API/web rerun passed 325/66.
  OpenAPI generation and browser contract check passed. The existing bundle-size
  advisory remains. Initial sandbox HTTP bind failures were rerun successfully with
  local networking enabled, without changing production code for the restriction.
- Final real PostgreSQL/Playwright handover suite: 7 passed. Verified date restrictions,
  equipment lookup and arbitrary-code rejection, all four profiles, correction,
  atomic follow-up/resolution, own-entry pagination, RLS and rollback, unresolved
  carryover, Start links and highlight withdrawal. Tested with disposable data;
  operator accounts/reports and the running Docker stack remain untouched.
- Dedicated Start browser checks: 2 passed at 1440/375px. Dialog Escape/focus return,
  focus containment, hidden search, category/department defaults, disabled worker
  date, mobile modal/document overflow and absence of page errors were checked.
  Desktop board/create/detail and mobile create/Start screenshots were inspected in
  `/tmp/iop-169-browser`. Visual review corrected dialog column widths and mobile
  stacking; final scoped web checks passed 7 tests across 3 suites.
- Documentation links/statuses, whitespace and changed-file secret hygiene passed.
  Backend rules/contracts are committed as `9ec267c`; the following UI/evidence
  commit completes this story. No merge, push or local-stack refresh is included
  without the owner's publication approval.

M6 assignment defaults remain deferred. Imported codes identify source references,
not canonical assets. Unsent form drafts are not persisted. Existing historical
snapshots and references are retained; new equipment selection requires a configured
source mapping and area. Publication remains a separate authorized step.
