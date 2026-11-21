# IOP-242 — Equipment analysis quick access plan

Status: Completed locally on 2026-11-21. Implementation authorized by the owner's
2026-11-20 request; publication remains pending.
Branch: `feature/IOP-242-equipment-quick-access`, created from clean `develop`
at `2efa4aa`. [Scope](../items/IOP-242-equipment-quick-access.md).

## Changes and steps

1. Extend OIP DataExplorer's inward-owned port/use case with validated equipment
   search. The PostgreSQL adapter returns at most 20 distinct code/sector/area
   tuples from the scoped relational reporting catalog, using literal case-insensitive
   matching and existing authorized transactions/time limits. Prioritize exact codes,
   then prefixes, so a complete short code cannot disappear behind the result limit.
   Add the HTTP DTO/route
   and regenerate OpenAPI/browser bindings. No persistence or grant changes.
2. Add the framework-free selection transition and gateway method under analysis.
   Compose an on-demand shared Dialog into ReportWorkspace, with debounced lookup,
   keyboard autocomplete, explicit selection, safe async states and localization.
   Reuse Daily / monthly and its single-equipment analysis; keep selected months,
   apply the exact tuple and clear conflicting dimensions. Use existing identity
   tokens for the compact result list; no alternate analytics screen/cache/index.
3. Validate relevant API/use-case/adapter and browser tests, contract generation,
   architecture/design guards, desktop/mobile rendering and normal filter editing.
4. Record results, complete item/backlog, archive plan and commit locally. Ask for
   publication of this named story and develop to origin after reviewable completion.

Expected files: OIP domain/application/DataExplorer adapter; host controller and
contracts; generated API/browser contracts; analysis models/application/HTTP/React,
feature CSS, localization; targeted API/web/database/browser tests and this story's
planning records. Existing source schemas, authorization and report semantics stay
with their current owners. No new architectural pattern or ADR is required.

## Validation and evidence

Implemented Find equipment in the Data Analysis heading on every analysis template.
The dialog performs only a 250 ms debounced catalog lookup, capped at 20 tuples;
the selected tuple opens the existing focused view and preserves month gaps.
The lookup reuses `analytics.read`, scoped parameters, forced-RLS transactions and
the 30-second statement budget. Exact/prefix ranking keeps short codes reachable.

Validation:

- `npm.cmd test` passed: 575 API, 372 web, 78 database configuration tests and
  110 secrets-tool tests (four existing optional tests skipped), builds, generated
  contract parity, architecture, localization and design checks.
- `npm.cmd run typecheck` passed. Final API/web rebuilds and targeted lookup suites
  (two API, three web cases) passed after the ranking/input/retry refinements.
- Seven affected Playwright suites passed all 19 scenarios: quick access,
  drilldown, cache, focused equipment/errors, month comparison and cross-year
  selection. Final rebuilt quick-access suite passed its three desktop/mobile
  scenarios again. Tests intercept synthetic business APIs, not live plant data.
- Manually inspected desktop/light and mobile/German/dark search screenshots and
  the 320 px focused-result screenshot. No horizontal overflow; focus returns on
  Escape; keyboard selection distinguishes duplicate codes. Filters remain editable
  with nonconsecutive months retained. Unit cases cover no eager report, debounce,
  stale responses, blank/whitespace changes, empty results and retry.
- Added real-PostgreSQL coverage for 235-code bounds, literal matching, exact short
  code ranking, duplicate area contexts across months, source isolation, reader-only
  HTTP access and revoked grants. Not run locally: Docker/psql are unavailable.
  `node --check infra/database/test/reporting-workspace.spec.cjs` passed; database
  execution remains a publication-CI gate. No remote or persistent data was changed.
- `git diff --check` and local documentation link/status review passed.

The existing Vite chunk-size advisory remains; no unrelated bundle changes made.

No story/dependency translation is required: the read contexts are English.

## Closure

Item/backlog completed locally and plan archived. Publication of
`feature/IOP-242-equipment-quick-access` through develop to origin requires the
owner's approval under ADR-0008; Railway has not been updated for this story.
