# IOP-180 — Publication and local Docker activation

Status: In progress. The owner explicitly approved the complete publication and
activation sequence on 2026-09-30. Authored on
`feature/IOP-180-operational-visual-polish`.
Scope: [item](../items/IOP-180-operational-visual-polish.md).

## Steps and validation

1. Verify clean local refs and fetch origin. Reuse validated implementation
   `e0bfb30` and its [evidence](../completed/IOP-180-operational-visual-polish-plan.md)
   if integration introduces no code changes.
2. Commit the plan, merge the story into develop and push both approved branches
   atomically to origin. Preserve stage/master and review branches.
3. Rebuild only the Docker web service, preserving API/database containers and
   volumes. Verify health and compare served assets with the validated build.
4. Run the four existing Start/handover desktop/mobile journeys against Docker
   with intercepted API fixtures; inspect the resulting screenshots.
5. Record evidence, archive this plan, update item and implementation-plan status,
   and publish the completion documentation through the same approved path.

## Evidence

Pending publication and activation.
