# IOP-225 - Publish Railway updates only for application changes

## Status and scope

Blocked for pre-deployment backup approval; automatic activation is configured.
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
The enable flag is now `true`. The first deployment is pending explicit approval
to export a current private database backup after automatic review rejected the
transfer as insufficiently authorized. Workflow/source publication can proceed.

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
  The owner's resumed request uses the existing repository Actions secret rather
  than duplicating it as an environment secret.

[Execution plan](../active/IOP-225-selective-railway-deployments-plan.md).
Follow [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and the
[workflow](../workflow.md). This changes delivery automation, not module boundaries.
