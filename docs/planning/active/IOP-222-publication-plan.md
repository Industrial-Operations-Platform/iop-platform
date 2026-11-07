# IOP-222 — Approved publication and activation

In progress, authorized by the owner's affirmative reply on 2026-11-07 to merge
`feature/IOP-222-start-information` into `develop`, push both refs to `origin` and
deploy the reviewed change to Railway.

## Steps and validation

1. Fetch and confirm remote parity, preserve all existing history and branches,
   merge the reviewed story into develop and push both branches atomically.
2. Wait for full CI validation of the exact published revision. The local machine
   has no Docker CLI; use the existing GitHub validation rather than claim local
   database/container checks. Existing focused checks and browser evidence are in
   the [implementation record](../completed/IOP-222-start-information-plan.md).
3. Export the current Railway database and verify retained imported months in the
   archive before deployment. Review the infrastructure plan and require no changes.
   Publish only allowlisted tracked deployment inputs with the exact revision.
4. Verify HTTPS health, authentication boundaries and the live build revision;
   inspect the new Start with the five German notice records, including Profile
   ordering and full-collection navigation. Check retained business data against
   the pre-release snapshot. No initial restore, credential change or schema change
   is part of this release.
5. Record actual outcomes, synchronize task/index status, archive this plan and
   publish the documentation closure through the same approved branch sequence.

## Evidence

Fetch confirmed `origin/develop` and local `develop` have no divergence. Reviewed
implementation is `9442148`. Automatic deployment is disabled and its configured
branch is `main`; this activation will be explicit. No remote configuration change
is needed. Stage/master promotion and branch deletion remain outside scope.
