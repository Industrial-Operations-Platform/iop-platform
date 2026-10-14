# IOP-210 — Global search and unified area overview

## Status and goal

Implemented module delivery; root host composition and assembled review pending under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
development authorization. Deliver IOP-119 global authorized asset/area/issue search
and IOP-118's unified area context using existing source-owned read boundaries.

## Scope and acceptance

- [x] One bounded global search with grouped results and navigation to source detail;
  missing/revoked source access remains explicit and supplies no data.
- [x] Unified configured-area overview of Handover/Maintenance/Assets and optional
  authorized analytical context, with date/coverage and role semantics.
- [x] Current backend permissions and exact source ownership; no search index that
  leaks another site's records or stale cached permissions.
- [x] Reusable shared identity, keyboard/narrow layouts and actual behavioral tests.

## Evidence and remaining work

Branch `feature/IOP-210-operational-search-overview`, from develop `24b6269`.
See the [completed plan](../completed/IOP-210-operational-search-overview-plan.md)
and [operator/integration guide](../../development/operational-overview.md).

The reusable controller, root-ready factory and web components are delivered.
Formal context queries actual saved records with producer pagination and invokes
actual previous-shift lookup only after explicit record selection. OIP consumes only
explicit department sector mappings. Source-unknown areas remain unmapped; no live
health, plant identity or historical state is inferred.

Remaining host work belongs to the assembling IOP-203 branch: register controller,
instantiate factory, compose navigation/German dictionary, generate public schemas
and verify assembled desktop/narrow browser behavior. This item does not claim those
shared files were changed in this isolated delivery.

Profile bootstrap uses only the finite existing source-read catalog; revoking
Workforce alone leaves other independently authorized source reads available.
Infrastructure failures propagate rather than falling through another source.
See the [bootstrap regression](../completed/IOP-210-profile-bootstrap-plan.md).
