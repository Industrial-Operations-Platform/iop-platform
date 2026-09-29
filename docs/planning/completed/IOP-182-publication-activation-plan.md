# IOP-182 — Publication and Docker activation

Status: Completed. Owner explicitly approved story/develop publication and local
Docker update on 2026-09-30.
Branch: `feature/IOP-182-entry-detail-neutral-start`, created from `develop`.
Scope: [item](../items/IOP-182-entry-detail-neutral-start.md).

## Steps and validation

1. Check refs, fetch origin and commit this execution record on the story branch.
   Merge into develop and atomically push both branches to origin; verify hashes.
2. Rebuild/activate web with `docker compose -f compose.platform.yaml up -d --build
   --no-deps --wait web`. Preserve API/database identities and persistent data.
3. Verify container health, root/proxied health and served assets against the
   validated build. Run existing Start/handover browser journeys against Docker
   with intercepted API fixtures and inspect the served rendering.
4. Record actual evidence, synchronize item and implementation-plan status, archive
   this plan and commit/publish completion documentation through the same approved
   story/develop path. Preserve stage/master and the review branch.

Reuse [implementation evidence](../completed/IOP-182-entry-detail-neutral-start-plan.md)
when integration introduces no code changes. No dependency or image-tag upgrades,
setup, migrations, seed changes or volume deletion are needed for this UI update.


## Evidence

- After fetch, local develop and origin/develop matched at `08a9e25`. Develop
  fast-forwarded without conflicts to `bb6be5f`, including implementation `c6756da`.
  Atomic publication succeeded; `git ls-remote` verified both remote refs at
  `bb6be5f1b486e53b3ff0c806815f4ffbf5658766` before completion documentation.
- Web image rebuilt and activated successfully. Container `106d42cb8f21` is healthy;
  API `f4e3559daf58` and database `0a4dce3d3541` retained their identities and health.
  Root and proxied `/health` returned HTTP 200.
- Served `index-CRZw84yX.js` and `index-Csv3G3hk.css` match the validated local build
  byte-for-byte. Frontend sources remain identical to implementation `c6756da`.
- All five existing browser journeys passed against Docker: handover at 1440px,
  820px and 375px, Start at desktop/mobile. Requests use intercepted fixtures;
  operational records were not changed. Inspected refreshed desktop detail and
  mobile Start screenshots. Existing implementation test evidence remains valid.
- Logs: `/tmp/iop182-docker-update.log`, `/tmp/iop182-live-browser.log`,
  `/tmp/iop182-served-verification.json`. Existing bundle-size warning remains.
- Item/plan links and statuses synchronized; local Markdown links and whitespace
  checked. This record is archived and its completion commit follows the already
  approved story/develop publication path. No API rebuild, migration, seed, volume,
  stage/master or review-branch deletion changes. Existing tabs need a reload.
