# IOP-225 - Develop-only GitHub validation

In progress. Authorized by the owner's 2026-11-08 request to avoid duplicate
Actions consumption: story branches run relevant checks locally; only develop
runs hosted validation for Railway delivery.
Branch: `fix/IOP-225-develop-only-validation`, from develop at `f267148`.
[Permanent scope](../items/IOP-225-selective-railway-deployments.md).

## Changes and validation

1. Restrict `.github/workflows/validation.yml` pushes to develop, remove the pull
   request trigger and guard manual jobs against other refs. Retain manual dispatch,
   change classification, serialization and validated-revision deployment guards.
2. Update `docs/development/railway.md`, the permanent item and backlog. Existing
   classifier support for historical pull-request events is outside this edit.
3. Parse workflow YAML and exercise a develop/story/tag/pull-request/manual event
   matrix locally. Run the scripts regression suite and check links/whitespace.
4. Archive evidence, commit, integrate and push the named story/develop refs under
   the owner's ongoing IOP-225 remote-publication authorization. Verify GitHub
   creates only the develop push run for the published SHA. Workflow-only changes
   require validation but do not independently deploy Railway.

Ownership stays in delivery automation; no module, API or data boundaries change.

Local evidence: all 99 scripts tests passed (four Windows/POSIX skips). Parsed
workflow YAML passes eight event/ref scenarios covering develop, story branches,
stage, tags, pull requests and manual runs. Deployment dependencies, runtime/opt-in
gates, default manual validation and serialization remain intact. Whitespace checks
pass. Remote trigger verification remains pending publication.
