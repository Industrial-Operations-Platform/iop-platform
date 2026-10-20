# IOP-219 — Compatible model integration

Completed local code integration. The owner's 2026-10-20 instruction to unify the pending work with
develop authorizes local integration of IOP-211 and IOP-219, including conflict
resolution and validation. Branch: `fix/IOP-219-locator-reference-curves`.
[Permanent scope](../items/IOP-219-locator-reference-curves.md) and
[validated independent increment](../completed/IOP-219-locator-reference-curves-plan.md).

## Dependency and remaining steps

The running models use Motor/Photoelectric sensor kinds and preparation behavior
from `feature/IOP-211-locator-models-and-access`. Integration is now authorized.
The branch audit confirms IOP-204–210 already reached develop through the IOP-203
composition; retain those historical refs without duplicating their implementation.
The clean develop worktree is `/private/tmp/iop-220-develop-publication`, initially
at `f4db019`, including the completed IOP-220 title refinements.

Merge current develop into the correction branch, then integrate IOP-211 without
rewriting history and
resolve overlapping Locator/contract/documentation changes while preserving both
stories' intended behavior. Revalidate current permissions, camera/view continuity,
model preparation, source privacy and corrected geometry. Preserve IOP-220's title
hierarchy in Formal Handover and regenerate contracts. Commit the reviewed merge,
then merge the validated correction branch into local develop. Use its existing
clean worktree; retain all story branches and do not push without separate approval.
After integration, detach the clean temporary develop worktree and return the
primary workspace to develop without deleting either worktree or any branch.

Prepare local activation for explicit approval. When authorized and compatible,
recheck the three private `IOP-219-scene-revisions.json` payloads against current
scenes and save through Locator's current Administrator application boundary, with
optimistic revisions and unchanged generated components. Never replace scenes by
direct SQL or overwrite conflicting edits. Original images stay unchanged.

## Validation and closure

Run relevant API/web tests, type checks, builds, contract/design/architecture checks
and actual desktop/mobile model inspection after integration. Verify preserved
component identities/counts and immutable before/after revisions for any applied
payloads. Complete item/backlog only when the remaining model outcome is achieved.
Keep local commits automatic; obtain separate publication approval naming the story
branch, merge into develop and both pushes to origin. Do not activate services or
publish by inference.


## Resolution and validation evidence

The merged tree preserves IOP-211's Motor/Photoelectric sensor templates, model
preparation, exact operational identity reads and integrated Shift Handover
navigation; IOP-219 adds reader-safe reference dimensions, current-Administrator
image authorization, smooth quarter/S curves and context-loss/selection reuse.
The actual-profile and preview guards retain IOP-217 configuration restrictions.
IOP-220 title CSS remains byte-identical to its accepted increment, and its Formal
Handover heading/card markup is retained.

Necessary regression updates remove old standalone Asset-read expectations for
Team Leader/Task Force and previews, add missing dimensions to browser fixtures,
and measure scene renderer reuse only after the asynchronous detail has opened.
The thirteen-destination sidebar scroll check uses 1366×640 after moving Formal
Handover into Shift Handover. Demo prerequisite errors now name Administrator.

Validation with Node 24.21.0:

- Full API: 53 suites / 551 tests passed; API build/typecheck passed. Post-build
  startup/model preparation: 2 suites / 9 tests passed.
- Full web: 46 suites / 301 tests passed; web typecheck, build, design guard and
  generated OpenAPI/browser contract check passed.
- Disposable PostgreSQL: 6 suites / 67 tests passed (Locator, Asset domain, Assets,
  Maintenance, Operational Overview and analytical workflows). Database build and
  TypeScript checks passed; no running installation data was used or changed.
- Script/security tooling: 9 suites / 68 tests passed. Database configuration unit
  checks: 77 tests passed. Final secret hygiene, diff/conflict and link checks pass.
- Final browser run: 28 scenarios passed together in 48.3 seconds across Locator
  privacy/fallback, exact reader navigation, Handover, compact Actions filters and
  desktop/mobile presentation. The corrected 1366×640 sidebar case is included.
  Desktop model viewing, mobile Administrator editing and dark mobile reader
  screenshots were visually inspected; source planes remain confined to editing.
  Evidence is retained under ignored `apps/web/test-results/`.

The validated merge combines IOP-211 tip `b3a4a01` with correction-branch parent
`0c22452`, which already includes current develop `f4db019`. The resulting branch
is promoted to local develop without rewriting history or deleting review refs.
Remote publication and local service/model activation remain separate approvals.
The [remaining activation plan](../active/IOP-219-locator-model-activation-plan.md)
preserves the private prepared scene revisions and keeps the parent item open.
