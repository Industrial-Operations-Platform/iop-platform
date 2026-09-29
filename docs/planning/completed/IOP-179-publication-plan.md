# IOP-179 — Publication and Docker activation

Status: Completed. The owner explicitly approved merging
`fix/IOP-179-handover-entry-title-style` into `develop`, pushing both branches to
`origin` and updating local Docker on 2026-09-29.
This plan is authored on that story branch. [Scope](../items/IOP-179-handover-entry-title-style.md).

1. Verify clean refs and remote state. Reuse the validated
   [implementation evidence](../completed/IOP-179-handover-entry-title-style-plan.md)
   if integration introduces no code changes.
2. Commit this plan, merge into develop and publish both refs atomically.
3. Rebuild only the web service with Docker Compose, preserving API/database
   containers and volumes. Verify health and served assets against the local build.
4. Run the existing desktop/mobile handover journeys against the Docker-served
   frontend using intercepted fixtures; inspect the title hierarchy.
5. Archive the completed plan, synchronize the item and publish the evidence through
   the same approved story → develop path. No stage/master or branch deletion.

## Publication and activation evidence

- Local and origin/develop started at `3a20e64`; develop fast-forwarded to
  `da5c1dc`, including implementation `ffe1cde` and documentation `fffd49e`, without
  conflicts or code changes. Atomic publication of both approved refs succeeded.
- `docker compose -f compose.platform.yaml up -d --build --no-deps --wait web`
  succeeded. Served JS `index-I4P-RvHE.js` and CSS `index-BX3FMzG0.css` match the
  validated local build byte-for-byte. The shared title rule uses link ink and
  label weight; root responds successfully and proxied `/health` returns HTTP 200.
- New web container `be08873ad2a5` is healthy. API `f4e3559daf58` and database
  `0a4dce3d3541` retain their previous identities and remain healthy. No setup,
  migration, seed, account or volume operations were performed.
- Both existing handover browser journeys passed against the Docker-served app at
  1440px/375px using intercepted API fixtures, without writing operational records.
  Inspected `/tmp/iop178-meeting-1440.png` from that run: entry titles are blue and
  semibold while category headings remain navy and bold.
- Logs: `/tmp/iop179-docker-update.log`, `/tmp/iop179-live-browser.log`,
  `/tmp/iop179-served-verification.json`. Existing build bundle-size warning remains.
- Documentation links/statuses and diff whitespace passed. Completion documentation
  follows the same approved publication path. Open tabs need one reload for the new CSS.
