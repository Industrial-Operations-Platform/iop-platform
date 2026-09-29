# IOP-180 — Publication and local Docker activation

Status: Completed. The owner explicitly approved the complete publication and
activation sequence on 2026-09-30. Authored on
`feature/IOP-180-operational-visual-polish`.
Scope: [item](../items/IOP-180-operational-visual-polish.md).

## Steps and validation

1. Verify clean local refs and fetch origin. Reuse validated implementation
   `e0bfb30` and its [evidence](../completed/IOP-180-operational-visual-polish-plan.md)
   if integration introduces no code changes.
2. Commit the plan, merge the story into develop and push both approved branches
   atomically to origin. Preserve stage/master and review branches.
3. Rebuild only the Docker web service, preserving API/database containers and
   volumes. Verify health and compare served assets with the validated build.
4. Run the four existing Start/handover desktop/mobile journeys against Docker
   with intercepted API fixtures; inspect the resulting screenshots.
5. Record evidence, archive this plan, update item and implementation-plan status,
   and publish the completion documentation through the same approved path.

## Evidence

- Local and origin/develop started at `0ded085`. The approved story fast-forwarded
  develop to `98d81b5`, including implementation `e0bfb30`, without conflicts or
  additional code changes. Atomic publication of both approved refs succeeded.
- `docker compose -f compose.platform.yaml up -d --build --no-deps --wait web`
  rebuilt and activated web successfully. Served JS `index-CnS3d5xV.js` and CSS
  `index-dC0Bq_Kh.css` match the validated local build byte-for-byte; the inline
  navigation, paired metrics, location emphasis and refresh styles are present.
  Root responds successfully and proxied `/health` returns HTTP 200.
- New web container `8cfc33662e8a` is healthy. API `f4e3559daf58` and database
  `0a4dce3d3541` retain their identities and remain healthy. No setup, migration,
  seed, account or volume operations were performed.
- All four Start/handover browser journeys passed against the Docker-served app
  at 1440px/375px using intercepted API fixtures. They do not write operational
  records or claim live-database business-flow coverage. Inspected updated
  `/tmp/iop180-start-1440.png` and `/tmp/iop180-journal-375.png`.
- Logs: `/tmp/iop180-docker-update.log`, `/tmp/iop180-live-browser.log`,
  `/tmp/iop180-served-verification.json`. Existing bundle-size warning remains.
- Documentation links/statuses and diff whitespace checked. Completion evidence
  follows the same approved story → develop publication path. Existing browser
  tabs need one reload to load the new assets.
