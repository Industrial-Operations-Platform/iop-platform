# IOP-187 — Approved publication and activation

Status: In progress

Authorization: on 2026-10-01 the owner accepted the reviewed IOP-187 changes and
approved the pending story-to-develop merge, publication of both refs to origin
and local Docker update. Branch: `fix/IOP-187-compact-workforce-tables`.
Scope: [story](../items/IOP-187-compact-workforce-tables.md).

## Execution and validation

1. Commit this publication record on the clean story branch, fast-forward
   `develop`, and atomically push both approved refs to `origin`.
2. Build and activate only Compose `web` with `up -d --no-deps --wait web`.
   Reuse the validated application build and retained API/database data.
3. Verify remote refs, service health, HTTP endpoints and served asset parity.
   Inspect the running browser when available. Record evidence, archive the plan
   and publish completion documentation through the same approved refs.

Preflight: `develop` and fetched `origin/develop` agree and are ancestors of
`61e5a95`. API `6c95a639e22a`, database `0a4dce3d3541` and web `3efdc2834b4e` are
healthy. The other unmerged refs are older, unrelated documentation review branches;
this approval covers the IOP-187 changes under review, not Proposed ADR acceptance.
No stage/master promotion, branch deletion, seed or credential resets.

Files: this plan and the permanent item. New owner requests will use a separate
story branched from the integrated result.
