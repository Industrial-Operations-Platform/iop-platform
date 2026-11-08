# IOP-225 - Publish Railway updates only for application changes

## Status and scope

Completed: automatic deployment and develop-only hosted validation are verified.
Activation resumed by the owner on 2026-11-08 after manually creating
the repository Actions secret `RAILWAY_TOKEN`. On 2026-11-08 the owner requested integrating all pending work and
limiting GitHub-triggered Railway publication to code changes, such as features
and fixes, without a special deployment marker. Documentation should not incur
the full validation/build/deployment pipeline.

Implementation is validated. GitHub's development environment, five variables
and develop-only deployment policy are configured. The owner resumed the previously
deferred activation, requested the workflow use the existing repository secret,
and authorized synchronization with origin. Enable the repository opt-in and verify
deployment through GitHub without reading or copying the stored secret value.
The enable flag is now `true` and the workflow is published. After automatic review
rejected the initial backup transfer, the owner explicitly approved exporting the
full remote database to a private local backup and continuing deployment.
The `fe0eecf` push subsequently passed complete Linux validation and deployed
automatically with the updated token. HTTPS serves that exact revision; the
165 publications and seven imported months are preserved.

- Run hosted validation only for develop pushes or explicit manual runs on develop.
  Story branches and pull requests use the relevant local checks before integration;
  neither triggers hosted validation. This is the owner's 2026-11-08 refinement.
- Detect changed files across the complete develop push.
- Skip expensive validation for documentation-only changes; test/tooling changes
  may validate but must not independently deploy the application.
- Deploy changes affecting Railway's application/build inputs after successful
  validation on develop, retaining the existing repository opt-in variable.
- Make manual deployment an explicit workflow input, defaulting to validation only.
- Integrate the pending development environment naming, deployment guards and
  operator documentation; preserve the separate personal-username increment.
- Commit and publish the authorized story and its integration into develop.
- Configure GitHub's development environment with an environment-scoped Railway
  credential and restrict deployment access to develop; verify the configured state.
  The owner's resumed request uses the existing repository Actions secret rather
  than duplicating it as an environment secret.

[Execution record](../completed/IOP-225-selective-railway-deployments-plan.md).
[Develop-only follow-up](../completed/IOP-225-develop-only-validation-plan.md):
one develop Actions run for `ee5ded4` published to both branches; story pushes
and pull requests no longer trigger hosted validation.
Follow [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and the
[workflow](../workflow.md). This changes delivery automation, not module boundaries.
