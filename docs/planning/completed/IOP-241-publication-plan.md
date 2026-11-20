# IOP-241 — Approved publication and Railway verification

Status: Completed. Branch: `feature/IOP-241-scalable-month-picker`.
[Scope](../items/IOP-241-scalable-month-picker.md) and
[implementation evidence](../completed/IOP-241-scalable-month-picker-plan.md).

## Authorization and steps

On 2026-11-20 the owner approved the request naming this story, its merge into
develop, both pushes to origin and Railway verification.

1. Inspect origin refs and the configured Railway development target. Retain and
   verify a fresh private remote PostgreSQL backup before triggering deployment.
2. Commit publication authorization on the story, merge into develop and push both
   named refs atomically. Preserve other branches and all existing data.
3. Observe complete GitHub validation and automatic Railway publication; inspect
   failures without bypassing guards. Verify the exact HTTPS revision, anonymous
   access controls and delivered month-picker assets.
4. Run the existing 36-month/year-picker browser scenarios against the hosted
   frontend using intercepted fictional API fixtures. These do not authenticate
   against or mutate live business data. Compare remote table/import counts with
   the pre-release backup separately.
5. Record results, synchronize item/backlog, archive this plan and publish the
   documentation closure through the same approved story/develop sequence.

## Files and validation

Tracked edits are limited to this publication plan, the IOP-241 item and backlog.
Private helpers, backups, logs and browser artifacts stay under ignored `.railway/`.
Reuse successful implementation checks; verify integrated source equality,
links/statuses, whitespace, remote parity and a clean tree. No stage/master
promotion, history rewrite or branch deletion.

Initial inspection: clean tree; implementation `75f5e60`, local develop `23663dd`.
The implementation passed 38 focused web checks, 26 architecture checks, build/
typecheck, 9 browser scenarios and 6 repeated cross-year cases.

Origin inspection confirmed develop `23663dd` and no existing IOP-241 remote
story branch. Railway targets IOP-development/development with separate iop and
database services and automatic deployment enabled; HTTPS initially serves
`333508c`. A fresh protected PostgreSQL custom archive (32,435,596 bytes) was
retained privately and checked for signature, SHA-256 and required table-data
entries through remote `pg_restore --list`. Its manifest records 62 table counts
and 175 imports across May–November 2026, including 16 November dates. Counts were
stable during export; no remote write/restore or isolated restore was performed.

## Publication and live verification

- Authorization commit `2b4901e` merged into develop as `732f9fe`. The merge tree
  equals the story tree and application inputs equal validated implementation
  `75f5e60`. Both named refs were pushed atomically and independently checked with
  `git ls-remote`.
- [Run 44698908912](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/44698908912)
  passed complete Linux validation, all four container builds, synthetic Railway
  image checks and automatic deployment. API 573, web 367, database 340 and all
  127 browser scenarios passed. No validation/deployment guard was bypassed.
- On 2026-11-20, HTTPS `https://iop-development-9fb7.up.railway.app/build-revision.json`
  returned exact revision `732f9feaffb9f77ed44400b6347286fb9ae91cbe`.
  Independent smoke checks passed web/API response, password-mode anonymous
  context and anonymous business-access denial. Delivered entry/analytical assets
  include the new month-selection actions and year-toggle presentation.
- `month-picker-years.spec.ts` ran against that hosted frontend with private
  configuration and intercepted fictional API fixtures: 3/3 passed (16.3s), exit 0.
  The 36-month scenarios cover nonconsecutive selection across 2024/2025/2026,
  retained equipment criteria, Apply/reset, Error/Daily navigation and keyboard/
  Escape behavior at 1440px English/light, 375px German/dark and 320px English/light.
  Inspected hosted control captures confirm the bounded grid and bulk actions.
  No live business login or mutation was performed by these fixture-driven checks.
- Separate read-only comparison confirmed unchanged counts for all 62 tables and
  unchanged May–November imports against the protected pre-release manifest.
  Backups, logs, manifests and hosted screenshots remain ignored under `.railway/`.
- Verification resumed after an automatic approval-review usage-limit interruption;
  rejected calls were not executed, and subsequent approved checks completed.

## Closure

Item/backlog mirror verified publication. This final documentation-only increment
is committed on the story branch and integrated/pushed through the same approval;
final ref hashes are reported in the completion message. It leaves application
sources identical to the live `732f9fe` release and does not request another
deployment. Verify links/statuses, whitespace, source equality, remote parity and
a clean tree; preserve all review branches.
