# IOP-181 — Local Docker activation

Status: Completed. The owner explicitly requested updating the Docker image on
2026-09-30. Branch: `feature/IOP-181-handover-view-polish`, matching develop at
`0f31066` before this slice. Scope: [item](../items/IOP-181-handover-view-polish.md).

## Steps and validation

1. Inspect current service identities and health. Rebuild and activate only web
   using `docker compose -f compose.platform.yaml up -d --build --no-deps --wait web`.
2. Verify web and proxied API health, compare served assets with the validated
   build, and check that API/database identities remain unchanged.
3. Run existing Start/handover desktop/mobile journeys against the Docker-served
   app with intercepted API fixtures; inspect screenshots. Reuse implementation
   [unit/build evidence](../completed/IOP-181-handover-view-polish-plan.md).
4. Record evidence, synchronize item and implementation-plan status, archive this
   plan and commit the documentation. Publish the status record through the same
   story/develop path already explicitly approved for IOP-181. No setup, migration,
   seed or volume changes.

## Evidence

- Rebuilt and activated `iop-platform-local-web` successfully. Web container
  `0499de59f237` is healthy. API `f4e3559daf58` and database `0a4dce3d3541` retain
  their identities and remain healthy. Root and proxied `/health` return HTTP 200.
- Served JS `index-Bc4JPz95.js` and CSS `index-DYCM9vcm.css` match the validated local
  build byte-for-byte. Source files remain identical to published `0f31066`.
- All four existing Start/handover journeys passed against Docker at 1440px/375px.
  API requests are intercepted fixtures; these checks do not modify operational
  records or claim live-database business-flow coverage. Inspected refreshed
  `/tmp/iop181-start-1440.png` and `/tmp/iop181-mine-375.png`.
- Logs: `/tmp/iop181-docker-update.log`, `/tmp/iop181-live-browser.log`,
  `/tmp/iop181-served-verification.json`. Existing bundle-size warning remains.
- Documentation links/statuses and diff whitespace checked. No API rebuild, setup,
  migration, seed, account or volume changes. Existing browser tabs need a reload.
