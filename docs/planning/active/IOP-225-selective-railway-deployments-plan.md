# IOP-225 - Selective Railway deployment

In progress: backup explicitly approved; automatic activation configured and published.
The owner resumed activation on 2026-11-08 after manually creating
the repository Actions secret `RAILWAY_TOKEN` and requested remote publication.
Branch: `fix/IOP-225-selective-railway-deployments`, from develop at
`7921e92`, after the authorized fast-forward integration of IOP-224.
[Permanent scope](../items/IOP-225-selective-railway-deployments.md).

## Steps and ownership

1. Review pending Railway development configuration, guards and documentation.
   Preserve them in this delivery increment; personal username tooling is a
   separate story. No database rename/apply operation is part of integration.
2. Add a dependency-free CI file classifier and complete Git-range detection.
   Gate full validation and deployment separately; keep commit messages agnostic.
   Preserve pull-request isolation, exact validated SHA and development targeting.
3. Add regression coverage for documentation, test-only and runtime changes,
   multi-commit pushes, renames/deletions, branch creation and manual dispatch.
4. Update the deployment guide, verify the workflow and run scripts/API tests and
   relevant guards. Record actual results and limits before committing.
5. Integrate into develop and publish under the owner's explicit instruction.
   Configure the missing GitHub environment and variables, transferring only a
   project/environment-scoped Railway token as an encrypted environment secret.
   Restrict that environment to develop. Verify remote refs and configured state.

Expected files: `.github/workflows/validation.yml`, `.railway/railway.ts`,
`.railway/README.md`, `README.md`, `scripts/railway/deploy.cjs`,
`scripts/railway/configure.cjs`, `scripts/railway-deployment.spec.cjs`, the new
CI classifier/tests, `docs/development/railway.md`, the existing IOP-222
publication record, and this story's item, backlog and execution record.

Sources: [GitHub workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
and [Railway autodeploy controls](https://docs.railway.com/deployments/github-autodeploys).
The lightweight classifier avoids GitHub's changed-file path-filter limits and
keeps required workflow status available on documentation-only changes.

Initial verification: GitHub's default branch is develop; repository variables and
environments are absent. The existing Git credential has repository administration
access. Railway's live API confirms project token creation accepts an explicit
project and environment. Existing services/data are preserved.

## Implementation evidence

- The scripts suite passes: 95 tests, with four Windows/POSIX skips. It includes
  22 change-scope cases and the pending Railway/username tool coverage.
- All 54 API suites pass: 560 tests, including the pending personal-login cases.
- Workflow YAML parses successfully. Deployment requires scope classification,
  successful full validation, the exact develop ref and the repository enable flag;
  manual deployment defaults to false. The source classifier requires no install.
- The earlier IOP-224 web build, design guards, unit tests and 11 browser checks
  remain applicable; no further application UI changes were made.

The owner explicitly approved the named token creation, encrypted transfer to the
GitHub repository/environment and automatic activation after the initial approval
review rejection. GitHub's `railway-development` environment now exists, with five
target variables and a deploy-branch policy allowing only develop. Railway's
OAuth CLI session rejects project-token creation with `Not Authorized`. Browser
access also stopped because its policy host could not verify the Windows browser
URL. No token was created or transferred; automatic deployment remains disabled.

Follow-up branch `fix/IOP-225-github-activation-status`, from develop at `980ec5c`,
also compares new story branches against the default branch's merge base, so a
new documentation branch does not classify the pre-existing application as new.
Added regression cases for new documentation and feature branches.

The updated classifier passes 24 regression cases. Indexed secret hygiene passed
for all 1,454 files; scoped whitespace and documentation-link checks passed.
Railway's live application source has no connected repository or image, so it
cannot bypass these Actions conditions through direct GitHub autodeployment.

Remaining activation: create the development-scoped project token through an
authorized Railway first-party interface, save it as the GitHub environment secret
and enable the repository variable. Do not transfer the account OAuth token.
No live application deployment or database mutation was performed in this increment.

The owner explicitly chose to leave activation pending on 2026-11-08. Record that
decision on `docs/IOP-225-deferred-activation`, from develop at `11a5df8`, integrate
and publish the source changes, and keep the deployment enable flag unset/false.
Resume token setup only when requested. This active plan retains the deferred
activation step; it does not block the completed source integration.

## Resumed token activation

Branch: `fix/IOP-225-token-activation`, from develop at `d2f21d1`, after the
owner-approved IOP-224 integration and push of its review branch and develop.
GitHub metadata confirms the repository secret exists, the development environment
has its five target variables and branch restriction, and the repository enable
flag is absent. Secret values are neither requested nor printed.

1. Update `.github/workflows/validation.yml` with an early missing-token check,
   preserving `secrets.RAILWAY_TOKEN`, post-validation gating and develop-only scope.
2. Update `docs/development/railway.md`, this plan, the item and backlog to document
   the owner's repository-secret setup and resumed activation. This supersedes the
   previous need to transfer a token into an environment secret.
3. Run the scripts regressions, parse/review workflow YAML, check documentation
   links and whitespace, and commit on the story branch. No module boundaries change.
4. Set repository variable `RAILWAY_AUTO_DEPLOY=true`, integrate the story into
   develop and push both branches to origin under the owner's publication request.
5. Take a current remote database backup as required by the Railway guide, then
   dispatch the explicit deployment workflow on develop because this increment
   changes only workflow/tests/docs; inspect Linux validation and token-authenticated
   deployment, then verify the published HTTPS revision. Record actual outcomes.

### Activation evidence and remaining approval

- GitHub metadata confirms the manually created repository `RAILWAY_TOKEN` secret;
  no duplicate environment secret exists. The five environment variables and the
  single develop deployment branch policy are present.
- Set and read back repository variable `RAILWAY_AUTO_DEPLOY=true` successfully.
- Scripts suite: 97 passed, four Windows/POSIX skips. Workflow YAML parses and its
  dependency, environment, token bindings, develop restriction and opt-in were checked.
- Indexed secret hygiene passed for 1,455 files; scoped whitespace checks passed.
- Automatic approval review rejected the attempted pre-deployment remote database
  export because deployment authorization did not clearly cover transferring the
  full potentially sensitive database into a private local backup. The export did
  not run. Obtain explicit approval for that backup before dispatching deployment;
  continue source publication independently. No Railway deployment was dispatched.

The owner explicitly authorized the full private SSH database export and continued
deployment in response to the approval question. The source/configuration increment
is published as `c0828ca` on the story branch and develop. The first
token-authenticated deployment remains in progress; no additional backup approval
is required. Preserve the backup outside Git and verify archive coverage first.

Backup verification completed: private custom-format archive, 29,788,836 bytes,
restricted to the current Windows user. Extracted publication data matches the
live database: 165 publications across all seven months from May through November
2026. The initial `pg_restore` invocation needed explicit `--file=-`; verification
then passed without restoring or modifying any database. The dump, extracted
verification data and SHA-256 manifest remain under ignored `.railway/backups/`.
The published story and develop refs both resolve to `c0828ca` at this checkpoint.
