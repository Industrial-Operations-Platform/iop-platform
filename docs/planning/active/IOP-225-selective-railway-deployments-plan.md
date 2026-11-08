# IOP-225 - Selective Railway deployment

In progress. Branch: `fix/IOP-225-selective-railway-deployments`, from develop at
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

Cloud credential setup is awaiting the owner's explicit confirmation: automatic
approval review rejected creating and transferring a new Railway environment token
without authorization naming the token and GitHub destination. The prepared setup
has not executed; repository publication and source integration are independent.
