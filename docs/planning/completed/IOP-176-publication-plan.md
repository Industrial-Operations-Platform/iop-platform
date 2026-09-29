# IOP-176 — Publication

Status: Completed. The owner explicitly approved merging
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

## Publication evidence

Origin/develop and local develop both started at `8a76431`. The validated spacing
fix is `1afadf3`; publication planning is `cd6cf76`. Develop fast-forwarded without
conflicts or code changes. Atomic push succeeded, and `git ls-remote` verified
both approved remote branches at `cd6cf7628e42d2fca9983e519842e433bc169e9e`.
The completion documentation follows through the same approved publication path.
Documentation links and `git diff --check` passed. No runtime activation occurred.
