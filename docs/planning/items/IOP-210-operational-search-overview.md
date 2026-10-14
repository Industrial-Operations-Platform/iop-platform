# IOP-210 — Global search and unified area overview

## Status and goal

In progress under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
development authorization. Deliver IOP-119 global authorized asset/area/issue search
and IOP-118's unified area context using existing source-owned read boundaries.

## Scope and acceptance

- [ ] One bounded global search with grouped results and navigation to source detail;
  missing/revoked source access remains explicit and supplies no data.
- [ ] Unified configured-area overview of Handover/Maintenance/Assets and optional
  authorized analytical context, with date/coverage and role semantics.
- [ ] Current backend permissions and exact source ownership; no search index that
  leaks another site's records or stale cached permissions.
- [ ] Reusable shared identity, keyboard/narrow layouts and actual behavioral tests.

## Evidence and remaining work

Plan before code on `feature/IOP-210-operational-search-overview`, from develop.
Formal-shift context may be composed through the new Handover contract after it is
integrated; date-based context must not pretend to be previous-shift evidence.
