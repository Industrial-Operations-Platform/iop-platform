# IOP-210 — Global search and unified area overview

Status: Completed module and assembled local software delivery. Branch `feature/IOP-210-operational-search-overview`, isolated
worktree `/private/tmp/iop-210`, from develop `24b6269`.
[Permanent context](../items/IOP-210-operational-search-overview.md).
Owner-delegated architecture uses Accepted ADR-0032 and root ADR-0037; source-owned
reads and the existing Start composition pattern require no new storage/service.

## Scope, files and steps

1. Build framework-free read composition under API `modules/operational-overview`
   using receiving-owned source ports. Source adapters invoke Assets, Handover,
   Maintenance and optional OIP/formal-shift public reads; no cross-module SQL/index.
2. Add host `overview-controller.ts`, `overview-contracts.ts` and an exported
   composition factory. Root owns shared runtime/navigation/permission wiring,
   generated schemas. Add standalone `composePlatformOverview` host composition with receiving-owned structural formal-record ports, actual previous-shift lookup, bounded page cards and optional explicitly mapped OIP department measures.
3. Add web `features/operational-overview` with a bounded global search component,
   grouped source navigation and configured location/date overview. Reuse shared
   SearchControl, DepartmentScope, DateField, identity and source coverage semantics.
   Add dedicated `localization/operational-overview-de.ts`; root composes de.ts.
4. Translate the entire IOP-118 and IOP-119 story files to English (their only
   remaining Spanish sentence), preserving status/IDs/links. Direct dependency
   stories read (IOP-040/064/116/067/073/095) are already English.
5. Verify validation/permissions/revocation/source failures/budgets, use-case and UI
   behavior, architecture/design/localization/type checks and real database source
   role isolation where feasible. Commit only this story; no merge or publication.

## Contracts and limitations

Every source checks current authorization independently; missing/revoked access
produces explicit coverage and no records. Global searches have per-source limits,
full source totals and explicit pagination, preserving source-owned cursors. No
persistent search cache or policy snapshot is introduced. Date-specific journal
records and pending issues stay distinct. Maintenance pending work is current,
not fabricated historical state. Optional analytics preserves date/units/coverage;
optional formal-shift context must explicitly identify unavailable/not-configured
when not composed. Health remains process liveness only.

## Validation

API tests and API/web typecheck; web design/localization/meaningful behavior tests;
real PostgreSQL with current profiles/grants and exact scope when dependencies permit.
Root integration owns generated contract checks and actual desktop/narrow UI review.

## Executed evidence — 2026-10-14

- API/web TypeScript checks passed; API and database builds passed.
- API overview/controller/composition/architecture tests: 34 passed in 5 suites.
- Web behavior/design/localization: 10 passed in 3 suites; temporary German
  dictionary composition was used only for validation and restored before staging.
- Real PostgreSQL: 6 passed using the actual host factory and source-owned
  Assets/Handover/Maintenance APIs. All four current profiles, stale broader
  Technician grants, current revocation, foreign membership and overlapping
  source codes across organizations were verified.
- Full API regression: 436 passed in 34 suites, including local socket controllers.
- Documentation links resolve in the assembled root; the IOP-203 context is owned
  by root and absent only from this story base. Secret hygiene and staged whitespace
  checks passed before commit.

IOP-203 now integrates runtime/controller registration, public generated schemas,
shared German composition, header search and original-source navigation. The
original IOP-118/119 software outcomes are complete with the evidence below;
source-unknown analytical area identities remain explicit pending input.

## Actual assembled browser evidence — 2026-10-14

Private isolated Playwright on the actual local installation verified global
Assets, Handover, Maintenance and configured-area result navigation to their exact
source details. Source-owned totals and bounded pages remain intact; Handover
currently returns 20 records per source page within the receiver's 50-record ceiling.

Area UI counts match independently queried source results: current pending issues
6, selected-day journal 0, work statuses 4/1/2 and registry 565 with 25 shown. These
are query/fixture coverage evidence, never a live plant-condition claim. An
authorized analytical department with no selected-day admitted import correctly
shows null/absent measures. Formal coverage uses the actual record contract and
does not invent a previous record when no saved option exists.

Desktop/light and 390px English views plus German/dark search/area and formal
controls were inspected. No page errors, failing browser API requests or horizontal
overflow occurred. Drafts were canceled without saving, provider metadata/account
passwords were unchanged, and customer text remained source data. Private
screenshots stay outside Git. Root's finite-profile-bootstrap correction and
Workforce-only revocation regression are recorded in the linked completed plan.
