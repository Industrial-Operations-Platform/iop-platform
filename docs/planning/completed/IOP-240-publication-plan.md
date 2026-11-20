# IOP-240 — Approved publication and Railway verification

Status: Completed. Branch: `feature/IOP-240-focused-error-analysis`.
[Scope](../items/IOP-240-focused-error-analysis.md) and
[implementation evidence](../completed/IOP-240-focused-error-analysis-plan.md).

## Authorization and steps

On 2026-11-20 the owner approved the request naming this story branch, its merge
into develop, both pushes to origin and Railway verification.

1. Check origin refs and the configured Railway development target. Retain and
   verify a fresh private remote PostgreSQL backup before triggering deployment.
2. Commit this authorization on the story branch, merge into develop and push both
   named refs atomically. Preserve other branches and all existing data.
3. Observe the existing complete GitHub validation and automatic Railway workflow;
   inspect failures before deployment without bypassing guards. Verify the exact
   HTTPS build revision, anonymous access controls and delivered analytical assets.
4. Exercise the hosted frontend with the existing synthetic/intercepted browser
   fixtures for the one/two/three-error boundary and real point hover. This does
   not authenticate against, read or mutate live business data. Compare remote
   table/import counts with the pre-release backup separately.
5. Record actual results, synchronize item/backlog, archive this plan and commit/
   publish the documentation closure through the same approved sequence.

## Files and validation

Tracked changes are limited to this publication plan, the IOP-240 item and backlog.
Private operational helpers, backups, logs and browser artifacts remain under
ignored `.railway/`. Reuse the implementation's successful tests, verify integrated
application-source equality, links/statuses, whitespace, remote parity and a clean
working tree. No stage/master promotion, history rewrite or branch deletion.

Initial inspection: clean tree; story implementation `55d7e58`, local develop
`80060ee`. No unrelated work is pending. Source changes already passed 36 focused
web checks, 26 architecture checks, build/typecheck and 9 browser scenarios.

Origin inspection confirmed develop `80060ee` and no existing IOP-240 remote
story branch. Railway targets IOP-development/development with separate iop and
database services and automatic deployment enabled; HTTPS initially serves
`2539d82`. A fresh protected PostgreSQL custom archive (32,434,218 bytes) was
exported privately, checked for signature/SHA-256 and required table-data entries
through remote `pg_restore --list`. Its manifest records 62 table counts and 175
imports across May–November 2026, including 16 November dates. Counts remained
stable during export; no remote write/restore or isolated restore was performed.

## Publication and verification evidence

- Authorization commit `8e78d15` merged into develop as `333508c`; the merge tree
  equals the story tree and application inputs equal validated implementation
  `55d7e58`. Both named refs were pushed atomically and independently checked
  through `git ls-remote`.
- [Run 44685217813](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/44685217813)
  passed complete Linux validation, all four container builds, the synthetic
  Railway-image checks and automatic deployment. API 573, web 361, database 340
  and all 124 browser scenarios passed. No guard was bypassed.
- On 2026-11-20, HTTPS `https://iop-development-9fb7.up.railway.app/build-revision.json`
  returned exact revision `333508cc3c2dd8e418510c4d9abfdd7ca47af23e`.
  Independent checks passed web/API response, password-mode anonymous context and
  denied anonymous business access. The served chunk `Workspace-GGwru21B.js`
  contains the new error-detail, error-count, contribution and scatter presentation.
- The existing `focused-error-analysis.spec.ts` ran against that hosted frontend
  with a private configuration and intercepted fictional API fixtures: 2/2 passed
  (13.8s), exit 0, at 1440px English/light and 375px German/dark. It verifies one/
  two simplified views, three-error Pareto restoration, both point coordinates,
  literal source text, empty results and daily-detail drill-down. Inspected hosted
  tooltip screenshots confirm both labels/values and no extra header zero. No
  live business login, source-data read or business mutation was performed by
  these fixture-driven browser checks.
- Separate read-only database verification found unchanged counts for all 62
  tables and unchanged May–November imports against the pre-release manifest.
  Backups, manifests, CI logs and hosted screenshots remain under ignored
  `.railway/`; no private artifact was published.

## Closure

Item/backlog mirror the verified publication. This final documentation-only
increment is committed on the story branch and merged/pushed through the same
approval; final ref hashes are reported in the completion message. Application
sources remain identical to the live `333508c` release, so the closure does not
request another deployment. Verify links/statuses, whitespace, source equality,
remote ref parity and a clean tree; preserve all review branches.
