# IOP-185 — Approved publication and Docker activation

Status: In progress — 2026-10-01.
Branch: `feature/IOP-185-administration-workforce-ui`, originally from `develop`.
Scope: [story](../items/IOP-185-administration-workforce-ui.md).

The owner explicitly approved merging the story into `develop`, pushing both
branches to `origin` and updating the local Docker application. This supersedes
the earlier implementation-only authorization boundary.

## Execution

1. Verify clean refs and fetch `origin`; preserve all unrelated work and branches.
2. Commit this record on the story branch, merge into `develop` without rewriting
   history and atomically publish the story and `develop` refs to `origin`.
3. Rebuild and activate the existing Compose `api` and `web` services. This story
   introduces no schema migrations; preserve the running database, private config,
   accounts and persistent volume. Do not rerun seed or reset credentials.
4. Check service health, HTTP responses, deployed assets/API artifacts and the
   running browser where available. Reuse the already-passing implementation
   tests when integration adds no code changes.
5. Record results, archive this plan, synchronize the story and commit/publish
   completion documentation through the same approved branch/develop sequence.

Files: this plan and the permanent story context; no application edits anticipated.
Validation: Git ancestry and remote hashes, Docker health and retained database ID,
served-build verification, documentation links/status and `git diff --check`.

No stage/master promotion, force push, branch deletion or infrastructure upgrades.
