# IOP-219 — Compatible model integration

Blocked on owner authorization. Branch: `fix/IOP-219-locator-reference-curves`.
[Permanent scope](../items/IOP-219-locator-reference-curves.md) and
[validated independent increment](../completed/IOP-219-locator-reference-curves-plan.md).

## Dependency and remaining steps

The running models use Motor/Photoelectric sensor kinds and preparation behavior
from unmerged `feature/IOP-211-locator-models-and-access`. The owner was asked to
authorize merging that dependency into the correction branch. The workflow forbids
silently integrating an unmerged prerequisite. No answer has been received.

After authorization, integrate the retained branch without rewriting history and
resolve overlapping Locator/contract/documentation changes while preserving both
stories' intended behavior. Revalidate current permissions, camera/view continuity,
model preparation, source privacy and corrected geometry. Regenerate contracts.

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
