# IOP-129 — End-to-end demonstration preparation

Status: Completed (documentation preparation only); IOP-129 remains Blocked.
Authorized by the owner's 2026-09-26 request for
[IOP-129](../items/IOP-129-end-to-end-scenario.md), limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-129-end-to-end-scenario`, created from clean `develop` at
`557c068` before edits. Unmerged IOP-136 documentation is not a prerequisite and
is not included in this branch.

## Scope and dependencies

Prepare a reproducible demonstration procedure and evidence checklist using the
existing fixture oracle and reconciliation procedure. No API, UI, schema, fixture,
reset implementation or architectural change is authorized by this increment.

| Dependency | Reviewed state and remaining gate |
| --- | --- |
| IOP-001 | Completed persona/workflow design; the later POC scope defers its historical login requirement. |
| IOP-048 | Internal reconciliation delivered; production OIP facts and importer/review path pending. |
| IOP-096 | Fictional drill-down delivered; production reads and connected views pending. |
| IOP-103 | Blocked on production receiver, importer/review and local host activation. |
| IOP-128 | ADR-0029 accepted; reset implementation and real reload pending. |
| ADR-0018 | Accepted; host adapter, origin/startup protections and delivered access verification pending. |

All directly read story files are already English; no translation edits required.
Existing internal tests and fictional previews cannot satisfy runtime acceptance.

## Files and steps

1. Create this plan before other edits.
2. Add `docs/development/demonstration-poc.md`: ordered preflight, import,
   errors/duplicates, filters/drill-down, presentation and safe recreation checks.
   Link the existing reconciliation matrix instead of maintaining a second oracle.
3. Update the IOP-129 item, backlog and delivery map with the actual Blocked status,
   accepted ADR-0018 state and procedure link.
4. Check local links, IDs/status agreement, fixture expectations and whitespace.
   Record evidence and move this completed preparation plan to `completed/`.
   Commit the documentation increment; keep IOP-129 open.

## Validation and runtime handoff

Documentation checks: local Markdown target existence, manual scope/status review,
oracle arithmetic and `git diff --check`. No runtime test result is claimed by
documentation preparation. Inspection of `apps/api/src/app.module.ts` shows only
health registration; the web import screen is explicitly disconnected.

Once prerequisites are integrated, create a separate execution plan with actual
endpoint/browser test paths and reset commands before edits. Run `npm run test:poc`
(including `npm test`, actual-role database and Playwright checks), adding delivered
journey coverage under that plan. Record observed rather than expected results for
every procedure step. Only then can the first two story acceptance criteria close;
this preparation supplies traceability but cannot close the overall story.

## Completion evidence — 2026-09-26

All 219 local Markdown links in the five changed files resolve. Independent sums
of the literal fixture rows confirm nine records, frequency 19 and 97,775 seconds.
Item/backlog both say Blocked; POC scope, accepted decision status and separation
from runtime evidence were reviewed. `git diff --check` passed. No application
code changed and no runtime tests or demonstration were executed. The first two
acceptance criteria remain unmet; evidence is recorded without closing the story.

The preparation increment is complete. Resume with a new runtime execution plan
after the named prerequisites are integrated; do not implement adjacent stories
or treat documentation publication as POC acceptance.
