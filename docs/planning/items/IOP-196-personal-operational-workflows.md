# IOP-196 — Personal Start and operational workflows

Status: In progress

Owner request of 2026-10-06: make Start useful to the signed-in person, separate
attention from ordinary open reports, simplify Maintenance status changes and make
Daily overview date selection, Information permissions, images and person notices work
consistently. This is one coherent refinement of the delivered operational workspace.

## Scope and acceptance

- [ ] Styled profile and assignment cards show role, home/current department, selected
  day/week shifts and zones, assigned maintenance, assigned reports resolved last
  calendar month, last-month shift distribution and current-month scheduled worked
  Saturdays/Sundays. Describe schedule-based counts honestly; do not claim attendance.
- [ ] Start defaults to the assigned department; browsing other departments is an
  explicit separate control. Blocking/overdue attention and ordinary open reports
  are distinct collections with server-side totals and matching navigation.
- [ ] Maintenance details expose Open/In progress/Blocked/Done actions independently
  of content editing. Done requires outcome, confirmation of tasks/place and complete
  related-report review; existing atomic closure, permissions and revision checks apply.
- [ ] Daily overview defaults to today and date changes affect every daily category.
  Pending configured carry-forward topics remain current, independently of historical
  daily selection. The calendar sits with the daily section heading.
- [ ] Information publication/correction requires Administrator/Team Leader coordinator
  authority. These accounts can attach bounded PNG/JPEG/WebP images; selected site
  people are explicit mentions and their publication/updates produce in-app notices.
- [ ] Relevant API/browser/database tests, contracts and desktop/narrow visual checks
  pass; documentation and local commits are ready for owner review.

## Boundaries

Reuse ADR-0032/0036 application ports, current scoped grants, JSON snapshots and
append-only revisions. Category restrictions stay in scoped configuration. Small
images are bounded snapshot content, not a new file-storage service. Mentions use
platform IDs, never inferred names in free text. No external messages, attendance
tracking, shift closure, M9, deployment or remote publication are authorized.

Dependencies: [IOP-184](IOP-184-m6-workforce.md),
[IOP-190](IOP-190-daily-handover.md), [IOP-192](IOP-192-operational-cards-account.md),
[IOP-193](IOP-193-compact-account-pending-matrix.md),
[IOP-194](IOP-194-maintenance-asset-history.md).
Execution: [plan](../active/IOP-196-personal-operational-workflows-plan.md).
