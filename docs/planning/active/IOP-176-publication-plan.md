# IOP-176 — Publication

Status: In progress. The owner explicitly approved merging
`fix/IOP-176-handover-action-spacing` into `develop` and pushing both branches to
`origin` on 2026-09-29. This plan is authored on that existing story branch.
Scope: [item](../items/IOP-176-handover-action-spacing.md).

1. Verify a clean working tree and remote refs; fetch origin and confirm develop
   can advance without overwriting remote work.
2. Commit this publication record on the story branch, merge the validated change
   into develop, and push both approved refs to origin.
3. Verify remote hashes, record publication evidence, archive this plan and publish
   the completion record through the same story → develop path.

Validation reuses the [implementation evidence](../completed/IOP-176-handover-action-spacing-plan.md)
when integration introduces no code changes; check documentation links and diff.
The separate IOP-175 branch remains pending review. Docker activation, stage/master
promotion, history rewriting and branch deletion are outside this approval.
