# IOP-190 — Daily Handover views and focused table filters

Status: In progress

Branch: `feature/IOP-190-daily-handover`, created from develop at `e68d290`.
Scope: [owner request](../items/IOP-190-daily-handover.md).
The owner approved continuing on IOP-188 on 2026-10-01. Bring
`feature/IOP-188-user-directory-refinements` into this story branch, preserving both
stories' completed work when resolving overlaps. This authorizes the local
dependency integration, not promotion to develop, remote publication or activation.

1. Handover domain/query ports and PostgreSQL: optional due-date range, responsible
   ID (including unassigned), external reference and condition filters; retain date
   and issue-state filters, full matching totals and stable cursors. Validate values
   and reject unknown query fields. Extend host DTOs and regenerate OpenAPI/browser
   schemas. No schema migration or permission change.
2. Host catalog adapter: optional category carryForward setting, with pilot defaults
   for Problems/Performance. Expose it in the Handover catalog; no customer labels or
   IDs embedded in domain behavior. Test configuration/defaults.
3. Browser Handover application and React: meeting first/default, exact selected-day
   Journal, independent department-status category pages for unresolved work through
   the selected day, retained state/detail navigation. Matrix header filter actions
   open compact shared dialogs; What?/Details have none. Keep filters available on
   empty results and clear pagination when applying a filter.
4. With the authorized branch dependency, Access React/shared controls: search icon
   beside Users, disclosed input, focus/Escape handling and visible active-search
   state. Retain search/sort/edit behavior from IOP-188.
5. Unit/API/real PostgreSQL and browser tests for dates, carry-forward categories,
   filters/counts/pagination and search controls. Validate English/German localization,
   architecture, generated contracts, desktop/mobile rendering and build.
6. Update product/operator/visual guidance and the owner-authorized ADR-0036 view
   refinement, record evidence, close item/backlog, archive plan and commit locally.

Files: Handover API domain, host catalog/DTOs and PostgreSQL adapter; web Handover
application/domain/React, Access React and shared controls; generated contracts,
relevant tests/localization and canonical documentation. Existing accepted patterns
apply. Read story/context files are English; no translation work is required.

## Evidence

Handover increment complete in `bb3325c` on 2026-10-01. Continue the now-authorized
user-search increment and verify the combined dependency before closing this plan.

- `npm run typecheck`: passed across API, web and database tooling.
- `npm test`: passed, including build/contract consistency, 18 script checks,
  342 API tests, 91 web tests and 77 database-tooling unit tests. Web checks cover
  dependency boundaries, identity tokens and localization; rerun after final UI
  changes also passed.
- Isolated PostgreSQL Handover suite: 12 passed. Combined date, due-date, assignee,
  reference and condition filtering runs before counts/cursors (23 matching records,
  pages of 20 and 3); unassigned, absent deadlines, literal wildcard characters,
  empty results and nonmatching states were checked. The real browser journey
  passed for all four profiles. Existing navigation assertions were updated for
  the new default tab; the baseline migration count was corrected to five.
- Browser navigation suite: 5 passed at desktop/tablet/mobile widths. New daily
  cases verify tab order/default, shared selected date, department scope, restricted
  carry-forward categories, future/resolved exclusions, resolution follow-up,
  combined filters and retained headers for empty results. Final desktop/mobile
  cases also verify Escape discards unsaved criteria and restores filter-button focus.
- Inspected desktop/mobile screenshots under `/tmp/iop-190-{daily,matrix,filter}-*.png`.
  Filter dialogs render outside the table so they inherit normal form typography.
- Documentation links and `git diff --check`: passed. Read story files were English.

No remote publication or operator-stack activation is included in this continuation.
