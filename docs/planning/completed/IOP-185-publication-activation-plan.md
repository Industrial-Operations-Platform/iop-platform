# IOP-185 — Approved publication and Docker activation

Status: Completed — 2026-10-01.
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

## Evidence

- Fast-forwarded `develop` to story commit `d0ffa4e` and atomically pushed both
  branches to `origin`; remote refs matched. This includes implementation commits
  `23acb26` and `fce7a46` and the existing local Workforce integration.
- Rebuilt `api` and `web` with `compose.platform.yaml`, then activated them with
  `up -d --no-deps --wait api web`. Both services and PostgreSQL are healthy.
  API image: `1d79a0d591bd`; web image: `92220fecb29a`.
- The database container `0a4dce3d3541` and volume
  `iop-platform-local_platform-data` were retained. No migrations, seed, account
  reset or private configuration changes were needed.
- At `http://127.0.0.1:8080`, health and session context returned HTTP 200;
  unauthenticated account activity returned HTTP 401. Served JavaScript and CSS
  matched the validated web build byte for byte; the running API controller,
  administration service and PostgreSQL adapter matched the validated API build.
- Reused the passing tests and desktop/mobile visual evidence in the
  [implementation plan](IOP-185-administration-workforce-ui-plan.md), since
  publication introduced no application changes. A fresh signed-in browser check
  was unavailable: the browser tool reported no available browser. The served
  assets match the previously inspected build.
- Completion documentation passed local Markdown-link checks and
  `git diff --check`; it follows the same approved story/develop publication path.
