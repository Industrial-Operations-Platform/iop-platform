# IOP-225 - Publish Railway updates only for application changes

## Status and scope

Deferred activation; implementation validated. On 2026-11-08 the owner requested integrating all pending work and
limiting GitHub-triggered Railway publication to code changes, such as features
and fixes, without a special deployment marker. Documentation should not incur
the full validation/build/deployment pipeline.

Implementation is validated. GitHub's development environment, five variables
and develop-only deployment policy are configured. Activation awaits a Railway
project token: the OAuth CLI cannot create one and browser control was stopped
because its current URL could not be verified. The owner has explicitly approved
the token transfer and activation, then explicitly deferred activation for now.
Source integration and publication remain authorized; do not activate deployment
until the owner resumes that step.

- Detect changed files across the complete push or pull request.
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

[Execution plan](../active/IOP-225-selective-railway-deployments-plan.md).
Follow [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and the
[workflow](../workflow.md). This changes delivery automation, not module boundaries.
