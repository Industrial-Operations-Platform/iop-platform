# IOP-169 — Handover board implementation

Status: In progress, 2026-09-29.
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
