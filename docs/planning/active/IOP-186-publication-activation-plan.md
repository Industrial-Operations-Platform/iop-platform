# IOP-186 — Approved publication and Docker activation

Status: In progress

Branch: `fix/IOP-186-table-card-alignment`, originally from `develop`.
Scope: [story](../items/IOP-186-table-card-alignment.md).

On 2026-10-01 the owner explicitly approved merging the story into `develop`,
pushing both branches to `origin` and updating the local Docker application.
This extends the implementation-only authorization recorded in the completed plan.

## Execution

1. Verify clean refs and fetch `origin`; commit this plan on the story branch.
2. Fast-forward `develop` and atomically publish both approved branches to `origin`.
3. Rebuild and activate only the changed Compose `web` service, with
   `up -d --no-deps --wait web`. No API, schema or configuration changes are present;
   preserve the running API, database, accounts and persistent data.
4. Verify all service health, HTTP responses and served assets against the already
   validated build. Inspect the running browser when available. Reuse the passing
   implementation tests because integration introduces no application changes.
5. Record evidence, archive this plan and synchronize the item. Commit completion
   documentation on the story branch and publish through the same approved
   story/develop sequence.

Files: this plan and the permanent story; no application edits anticipated.
Validation: ancestry and remote hashes, container IDs/health, served asset parity,
documentation links/status and `git diff --check`.

## Preflight evidence

- Clean story branch at `a32be0a`; fetched `develop` and `origin/develop` agree.
  `develop` is an ancestor of the story branch.
- API, web and database are healthy. Retain database container `0a4dce3d3541`
  with volume `iop-platform-local_platform-data` and API container `6c95a639e22a`.
  The current web image is `92220fecb29a`.

No stage/master promotion, force pushes, branch deletion, seed or credential resets.
