# IOP-198 — Start assignment layout execution

Status: Completed. Authorized by the owner's 2026-10-06 UI request and screenshots.
Story branch: `fix/IOP-198-start-assignment-layout`, created from clean `develop`.
Scope: [item](../items/IOP-198-start-assignment-layout.md).

## Changes and steps

1. Host (`WorkspaceApp`) composes a period-aware related-work slot and owns
   profile-aware navigation. Analysis `StartOverview`
   supplies sequential composition slots without importing operational features.
2. Workforce React `WorkforceToday` owns period controls and exposes their range
   through the related-work render slot, loads
   whole weeks for immediate day/week switching and preserves content while dates
   load. Its domain date helper remains the source for week boundaries.
3. Maintenance application owns bounded period selection; React
   `MaintenanceAssignments` and `maintenance.css` supply structured two-column
   cards. The optional clarification received no reply; the stated default is
   due-in-period plus overdue/undated work. Overdue means before today's site-local
   date, independently of the browsed period. Render at most four preview cards.
4. Shift Handover `MeetingCanvas`/`handover.css` group title/count and reduce empty
   space. Keep the Start department summary mounted across day/week changes; its
   existing current unresolved-work semantics remain intact.
5. Host `ActivityNotifications` and shared notification styles compact the fixed
   header/actions and scroll only feed content. Preserve source-owned read state.
6. Extend relevant browser/unit scenarios and the visual identity contract where
   presentation changes; check scope/status/links and close this plan on completion.

## Validation and evidence

Validated with Node 24.21.0 and the installed lockfile dependencies:

| Check | Result |
| --- | --- |
| `npm run build --workspace @iop/web` | Passed TypeScript, design guard (3 checks) and production build |
| `npm test --workspace @iop/web` | 146 tests passed in 28 suites |
| `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries` | 16 architecture checks passed, including browser inward dependencies |
| Playwright: Start assignment layout, personal workflows, Maintenance/Assets, linked Maintenance and Daily Handover | 22 scenarios passed at 1440px and 375/390px |
| Final built UI: Start assignment layout and personal workflows | 4 scenarios passed after final source review |

New behavior checks cover week reuse with no Day/Week request/loading flash;
delayed, stale and failed date responses; overdue/undated period inclusion;
Profile/assignment order; two desktop cards/one narrow column; whole badges/dates;
department-summary DOM persistence; no Technician Maintenance sidebar entry;
notification feed scrolling with a stationary header; Escape/focus restoration and
mark-all-read. Meeting empty cards measure below 160px and counts sit within 12px
of their category label. Browser journeys use intercepted source fixtures, not a
claim of new database integration coverage. No API/schema change is included.

Visually inspected `/tmp/iop-198-{start,notifications}-{1440,390}.png` and
`/tmp/iop-196-{week-375,daily-history-1440}.png`; layouts retain the shared identity
and have no page overflow. The latter captures are refreshed by the existing
personal-workflow scenarios. Read dependency stories contain English prose;
no translation-only edits were needed. Documentation links/IDs/statuses and
`git diff --check` were verified before the scoped local commit.

## Closure

All requested implementation criteria are met. Item/backlog are Completed and
this execution record is moved to completed. Keep the validated local story branch
for owner review; no persistent operator data, Docker stack or remote refs were
changed. Publication requires explicit approval to merge into develop and push
the story branch and develop to origin under ADR-0008.
