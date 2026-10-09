# IOP-199 — Handover category workflows

Status: Completed

Owner request of 2026-10-07, with notification and Safety form screenshots.
Refine the existing operational workspace as one coherent story.

## Scope and acceptance

- [x] Opening a notified Handover or Maintenance detail clears that notification
  for the current account/site, retaining unread unrelated and later updates.
- [x] New entries default to the author's assignment department for the entry day,
  with manual override. Floating/unassigned staff and leaders without a zone have
  no default. Browsing another department must not silently set the work location.
- [x] Safety accepts at most one configured area, with no equipment identifier or
  equipment condition. Server validation enforces the same rule as the form.
- [x] Success references explicit Performance/Problem reports or Maintenance work
  and completes the selected records on publication, with existing permissions,
  revision checks, outcomes and reviewed repair scope. No unrelated closure.
- [x] People continues to use Workforce/Shift assignment data, without duplicating
  the already delivered personnel planning workflow.
- [x] One technical-report form choice covers Problems/Performance. A blocked,
  nonoperating plant is classified as Performance requiring corrective maintenance;
  other technical problems are Problems. Performance shows current open-issue counts;
  the existing matrix and Department status retain outstanding reports.
- [x] Team Leader-published Information supports existing images, notifies all site
  users, has an author-selected inclusive display-until date, remains visible in
  Meeting preparation and every profile's Start while active, and expands to full
  readable content. Category panels adapt to their contents.
- [x] Meeting preparation and the personal Journal share one workspace; Journal
  shows only the author's entries, with retained history search and matrix access.

## Boundaries and evidence

Reuse Accepted ADR-0032/0036, scoped configuration, Workforce receiving-owned
lookups, snapshot/revision storage and the existing coordinated transaction pattern.
Keep category-specific defaults in host configuration. Reuse Maintenance completion
validation; do not bypass repair review or expand contributor authority. Information
is site-wide in-app content; no external messages, new file service, plant commands,
formal shift closure, M9, deployment or remote publication.

Dependencies: [IOP-184](IOP-184-m6-workforce.md),
[IOP-190](IOP-190-daily-handover.md), [IOP-192](IOP-192-operational-cards-account.md),
[IOP-194](IOP-194-maintenance-asset-history.md),
[IOP-196](IOP-196-personal-operational-workflows.md).
Execution and validation: [completed plan](../completed/IOP-199-handover-category-workflows-plan.md).
Completed locally on 2026-10-08. Owner-approved integration into develop, both
pushes to origin and local Docker activation completed on 2026-10-09; see
[publication evidence](../completed/IOP-199-publication-activation-plan.md).
