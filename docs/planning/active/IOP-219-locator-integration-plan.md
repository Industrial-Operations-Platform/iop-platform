# IOP-219 — Compatible model integration

In progress. The owner's 2026-10-20 instruction to unify the pending work with
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
