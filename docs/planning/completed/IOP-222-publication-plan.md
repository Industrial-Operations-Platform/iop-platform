# IOP-222 — Approved publication and activation

Completed, authorized by the owner's affirmative reply on 2026-11-07 to merge
`feature/IOP-222-start-information` into `develop`, push both refs to `origin` and
deploy the reviewed change to Railway.

## Steps and validation

1. Fetch and confirm remote parity, preserve all existing history and branches,
   merge the reviewed story into develop and push both branches atomically.
2. Wait for full CI validation of the exact published revision. The local machine
   has no Docker CLI; use the existing GitHub validation rather than claim local
   database/container checks. Existing focused checks and browser evidence are in
   the [implementation record](../completed/IOP-222-start-information-plan.md).
3. Export the current Railway database and verify retained imported months in the
   archive before deployment. Review the infrastructure plan and require no changes.
   Publish only allowlisted tracked deployment inputs with the exact revision.
4. Verify HTTPS health, authentication boundaries and the live build revision;
   inspect the new Start with the five German notice records, including Profile
   ordering and full-collection navigation. Check retained business data against
   the pre-release snapshot. No initial restore, credential change or schema change
   is part of this release.
5. Record actual outcomes, synchronize task/index status, archive this plan and
   publish the documentation closure through the same approved branch sequence.

## Evidence

Fetch confirmed `origin/develop` and local `develop` have no divergence. Reviewed
implementation is `9442148`. Automatic deployment is disabled and its configured
branch is `main`; this activation will be explicit. No remote configuration change
is needed. Stage/master promotion and branch deletion remain outside scope.

## Publication and activation evidence

- Authorization record `d8aece2` merged into develop as
  `d2aecfe71e81abead729fbf246808710c624184d`. Atomic push succeeded and independent
  `git ls-remote` confirmed both branch tips. The application tree equals reviewed
  implementation `9442148`.
- [Full CI run 42421392005](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/42421392005)
  passed for that exact develop revision: complete platform tests, four container
  builds and the synthetic Railway image check. Its automatic Railway job was
  intentionally skipped by the existing configuration; activation was explicit.
- Exported the current remote database to a private 28,305,039-byte PostgreSQL
  archive. Verified its checksum and extracted its publication data with
  `pg_restore` in read-only mode: all 159 retained publication dates matched the
  current database, covering May–October 2026. No restoration targeted production.
  Private evidence is under `.railway/backups/2026-11-07T22-36-31-306Z/`.
- The fresh Railway infrastructure plan had no changes. Deployment used the
  existing allowlisted tracked-input packaging, secret inspection, clean-tree and
  exact-revision guards. Windows IaC evaluation initially required the existing
  CLI-path environment fix used by the project wrapper; the private release helper
  was corrected before upload. No repository implementation or remote settings
  were changed to work around validation.
- Railway deployment `547efe71-11ce-43e9-87f0-44206fba5898` completed. HTTPS smoke
  verified `/health`, the web app, password authentication, rejection of anonymous
  business access and live build revision `d2aecfe71e81abead729fbf246808710c624184d`
  on 2026-11-07 at 22:49 UTC. The same installation was renamed to development
  on 2026-11-08 and is now at `https://iop-development-9fb7.up.railway.app`.
- Two browser scenarios passed using the deployed web assets and synthetic German
  notice fixtures: 1440px light and 390px dark, Profile first, three notice
  previews, all-five collection, Escape/focus return and exact detail navigation.
  Both deployed screenshots were visually inspected. Public sign-in also opened
  without browser errors. Private images are under `.railway/iop222-live-ui/`.
- Separately re-read the five real retained November Information records through
  the scoped application: German titles/details remain at revision 2 with history
  preserved. Post-release verification found all 62 table counts unchanged and all
  159 publication snapshots retained exactly. No authenticated Mike browser session
  was created for the synthetic rendering checks.
- Repository secret inspection passed for 1,441 indexed files. Source unchanged
  after validation; final documentation closure uses the same approved story-to-
  develop merge and atomic push. No further deployment is needed for documentation.

## Closure

The owner-requested UI and German Information content are active on Railway.
This closure archives the publication plan and synchronizes the item/backlog.
Final branch parity, unchanged application tree and clean status are checked after
the documentation push. Stage/master, credentials, volumes and branches are retained.
