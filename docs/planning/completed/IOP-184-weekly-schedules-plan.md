# IOP-184 — Manual weekly schedule continuation

Status: Completed. Branch: `feature/IOP-184-m6-workforce`.

## Authorized scope

The owner's follow-up extends the same unmerged M6 request: Team Leaders and
Administrators can enter or update a person's shifts by week, without preparing
email/CSV files. Continue on the already authorized final M6 review branch, originally
created from develop; preserve its four completed commits. The original completed
execution record remains historical. No merge or publication is authorized.

## Implementation

1. Add a bounded atomic Workforce weekly-schedule use case under `workforce.plan`,
   reusing current site transactions, personal schedule validation and revisions.
   Accept only one person's changes within one Monday–Sunday week. Validate current
   revisions, neighboring overnight intervals and existing assignments before writes.
   Existing zone/phone assignments are preserved; incompatible changes fail clearly.
   File imports, configuration and standalone logical removal remain admin-only.
2. Add the typed host route/OpenAPI and browser gateway/application port. No new
   schema or architectural pattern: reuse Accepted ADR-0014/0016/0032/0036.
3. Build a localized weekly editor in Workforce: person selection, seven dated rows,
   configured shift presets, selected-day bulk application and per-day adjustments.
   Load existing values, leave unknown/unselected days alone and show changed-day
   count. Reuse shared controls and visual-identity tokens; technician stays read-only.
4. Update the permanent IOP-184 context, permission clarification, product/operator
   documentation and backlog. Commit the validated continuation on the final branch.

## Validation

API unit and real PostgreSQL cases: planner/admin allowed, technician denied,
imports still restricted, atomic create/update, stale version, invalid/out-of-week
input, overnight conflicts and assignment retention. Browser tests cover existing
values, multi-day presets, individual edits, payload/revisions and role visibility.
Run API `npm test`, web tests, typecheck/build, generated contract comparison,
architecture/identity guards and actual desktop/mobile browser review. Update the
local API/web images without reseeding or modifying historical test data. Check
links, statuses, secret hygiene and Git diff before commit.

## Outcome and evidence

- Added `POST /api/v1/workforce/schedules/week`, with typed OpenAPI/day payloads,
  current `workforce.plan` authorization and all-or-nothing writes. Manual changes
  retain imported history, skip unchanged values and preserve existing assignments.
  Validation compares the proposed week together, including unchanged adjacent dates.
- The English/German editor loads existing schedules, applies configured shifts or
  statuses to selected days, supports custom intervals and saves only changed days.
  Weekday selection is a shortcut, not an instruction to invent weekend absences.
  Existing schedule details link directly to the selected person's weekly editor.
- `npm test` passed: 18 secret checks, 338 API tests, 83 web tests and 77 database
  configuration tests, including architecture/identity guards and contract comparison.
  `npm run typecheck` and builds passed. After explicit accessible select names were
  added, the focused Workforce/weekly/localization suites passed again (7 tests).
- PostgreSQL Handover/Workforce suite passed all 11 tests. Weekly cases verify
  planner authorization, reader/cross-site denial, no-op persistence and atomic stale
  revision rejection; application tests also cover assignment preservation, invalid
  weeks/dates, proposed-batch and neighboring overnight conflicts.
- Start Playwright regression passed at 1440 and 375 widths on isolated 33001/41731
  test ports. Actual local app: Team Leader created five days for synthetic account
  `m6.tech.1.1` in the week of 2026-11-02, then changed Wednesday to 13:45–23:00.
  The Technician could read the result and had no editor. German/English switching
  preserved the selected schedule. Desktop/mobile (1440/390) review found no page
  overflow or JavaScript errors. Screenshots: `/tmp/iop184-weekly-browser/`.
- Local API/web images rebuilt and activated without reseeding; the only demo-data
  writes were the five explicitly exercised November schedule days and one revision.
  Existing zone/phone and analytical data were preserved. Existing Vite bundle-size
  warning remains; this change does not alter the bundling strategy.

The continuation extends manual schedule editing only. File imports, site
configuration and standalone logical removal remain administrator-only. A schedule
change conflicting with an existing workplace assignment is rejected atomically;
that assignment must be corrected or removed by an Administrator before replanning.
No merge, push or history rewrite occurred. Final changes remain on the M6 review
branch with the completed original increment.
