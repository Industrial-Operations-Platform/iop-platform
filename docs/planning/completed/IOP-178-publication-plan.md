# IOP-178 — Publication and Docker activation

Status: Completed. The owner explicitly approved merging
`fix/IOP-178-handover-cards-navigation` into `develop`, pushing both branches to
`origin` and updating local Docker on 2026-09-29.
This plan is authored on that story branch. [Scope](../items/IOP-178-handover-cards-navigation.md).

1. Verify clean refs and fetch origin. Reuse the validated
   [implementation evidence](../completed/IOP-178-handover-cards-navigation-plan.md)
   if integration introduces no code changes.
2. Commit this plan, merge into develop and publish both approved refs atomically.
3. Rebuild only the frontend with `docker compose -f compose.platform.yaml up -d
   --build --no-deps --wait web`. Preserve API/database containers and volumes.
4. Verify health and served assets, then run the existing desktop/mobile handover
   browser journey against Docker with intercepted API fixtures and no live-data writes.
5. Record evidence, archive the plan and publish completion documentation through
   the same approved story → develop path. No stage/master or branch deletion.

## Publication and activation evidence

- Both local and origin/develop started at `fa0b82b`. Develop fast-forwarded to
  `17901a9`, containing the validated implementation `f047407`, without conflicts
  or code changes. Atomic push of the story branch and develop succeeded.
- Web rebuild/activation succeeded. The final web build/typecheck passed with the
  existing bundle-size warning. Served `index-Cvzzt1cP.js` and
  `index-DeEqe9Eq.css` match the final local build byte-for-byte; root and proxied
  `/health` respond successfully (health HTTP 200).
- Web container `877ad555639b` is healthy. API `f4e3559daf58` and database
  `0a4dce3d3541` retain their pre-activation identities and remain healthy.
  No setup/migrations, seed operations, account changes or volume operations ran.
- Both existing handover browser journeys passed against the actual Docker-served
  app at 1440px and 375px. Verified shared card styling, current-view breadcrumbs,
  return to every tab, department/date/search retention, retained loaded pages,
  keyboard navigation and existing detail/form checks. API calls were intercepted
  fixtures, with no writes to real operational records.
- Logs: `/tmp/iop178-final-build.log`, `/tmp/iop178-docker-update.log`,
  `/tmp/iop178-live-browser.log`, `/tmp/iop178-served-verification.json`.
- Documentation links, statuses and diff whitespace passed. This completion record
  follows the same approved story → develop publication path. Existing open browser
  tabs need one reload to load the updated asset URLs.
