# IOP-167 — Local update and publication

Completed local update and publication preparation. The owner approved merging `fix/IOP-167-users-administration-mode`
into `develop`, pushing both branches to `origin` and updating Docker on 2026-09-28.
Continue on the existing story branch, originally created from `develop`.
Scope: [IOP-167](../items/IOP-167-users-administration-mode.md).

## Changes and steps

1. Rebuild and recreate the web service with `compose.platform.yaml`.
2. Verify container health and compare the served JavaScript with the validated
   local build. Existing API/database containers and volumes stay in place.
3. Record evidence here and link from the item and implementation plan; archive
   this plan and commit the documentation increment on the story branch.
4. Fetch origin, check integration ancestry, merge into `develop`, then push
   the story branch and `develop` to `origin`. Verify remote refs and clean status.

## Validation and evidence

- The implementation passed 63 web tests and the production build.
- `docker compose -f compose.platform.yaml build web` and
  `docker compose -f compose.platform.yaml up -d --no-deps --wait web` passed.
- Web, API and database are healthy; only web was recreated.
- HTTP index and `/assets/index-BOtFE79K.js` return 200. Served JavaScript is
  byte-identical to the validated build, SHA-256
  `ef92cc73fc66c137efcad965cdd364e716955fa63eea8f4f7372acc0435ecc0f`.
- After fetching origin, local and remote develop both pointed to `8abeebd`;
  develop is an ancestor of the story branch.
- Documentation links and `git diff --check` passed. No source-code or
  architectural changes were needed. Merge/push follow this evidence commit;
  final ref verification is reported in the session result.
