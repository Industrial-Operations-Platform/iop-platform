# IOP-164 — Publish and refresh the local application

Completed local refresh. The owner explicitly approved merging/pushing IOP-164 and updating
the Docker image. Continue on `fix/IOP-164-hexagonal-cleanup`, created from develop.
[Permanent context](../items/IOP-164-hexagonal-cleanup.md).

## Steps and validation

1. Verify clean Git state, fetch origin and check develop ancestry before publication.
2. Build Compose `setup`, `api` and `web` images from the validated story source.
   No schema change exists; do not rerun provisioning/seed or replace the database.
3. Recreate only API/web with `up -d --no-deps --wait api web`. Verify health,
   HTTP responses, current compiled paths and that the database container/volume
   remain unchanged. Existing local credentials and data are retained.
4. Record evidence here, complete item/backlog, archive the plan and commit the
   documentation on the story branch. Merge into develop and push both branches
   to origin under the owner's publication approval; verify remote refs and clean
   working tree. No stage/master promotion or registry publication is included.

## Evidence

- `develop` and `origin/develop` matched before integration; the working tree was
  initially clean and the implementation commit was `3263bea`.
- `docker compose -f compose.platform.yaml build setup api web` succeeded.
  Images: API `5459029c5c24`, web `97cfa1620d51`, setup `b8cb66693cfa`.
- `docker compose -f compose.platform.yaml up -d --no-deps --wait api web`
  succeeded; API, web and database report healthy.
- Database container ID and named volume exactly match their pre-refresh values.
  No provisioning, seed replay, migration or database recreation ran.
- HTTP checks passed for `/`, `/health`, enabled local context, current JS/CSS,
  and authenticated analytical availability/profile reads through Nginx at
  `http://127.0.0.1:8080`. No imports or reporting configuration were changed.
- The running API contains the new host/domain/adapter paths and no retired
  `dist/demo`, root `application.js` or `bootstrap-error.filter.js` artifacts.
- Documentation links and `git diff --check` passed. Implementation tests are
  recorded in the [cleanup plan](IOP-164-hexagonal-cleanup-plan.md); this follow-up
  changes only documentation and local build/runtime state.

Publication of this evidence commit together with the implementation is already
owner-authorized under ADR-0008. Merge and remote-ref verification follow the
story-branch commit; no further approval is required for that sequence.
