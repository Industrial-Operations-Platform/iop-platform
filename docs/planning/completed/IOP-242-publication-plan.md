# IOP-242 — Approved publication and Railway verification

Status: Completed. Branch: `feature/IOP-242-equipment-quick-access`.
[Scope](../items/IOP-242-equipment-quick-access.md) and
[implementation evidence](../completed/IOP-242-equipment-quick-access-plan.md).

## Authorization and steps

On 2026-11-21 the owner answered "continue" to the explicit publication request
naming this story, its merge into develop, both pushes to origin and Railway
verification. This authorizes the full sequence under ADR-0008.

1. Inspect origin refs and the configured Railway development target. Export and
   verify a fresh protected remote PostgreSQL archive before triggering deployment.
2. Commit this authorization on the story, merge into develop and atomically push
   both named refs. Verify source equality and preserve all review branches/data.
3. Observe complete GitHub validation, including the previously unexecuted real
   PostgreSQL lookup cases, and automatic Railway publication. Diagnose failures
   without bypassing validation or deployment guards.
4. Verify exact HTTPS revision, authentication boundaries and served quick-access
   assets. Run the existing quick-access desktop/mobile scenarios against the hosted
   frontend with intercepted fictional business APIs; compare live table/import
   counts against the backup separately. No live business mutations are needed.
5. Record actual results, update item/backlog, archive this plan and publish the
   documentation closure through the same approved story/develop sequence.

## Files and validation

Tracked changes are limited to this plan, the IOP-242 item and backlog, plus any
necessary scoped validation fixes if CI reveals a defect. Private helpers,
archives, logs and hosted screenshots remain ignored under `.railway/`.
No stage/master promotion, history rewrite, branch deletion or data restoration.

Initial inspection: clean tree on the story at implementation `0bd0295`; local
develop is `2efa4aa`. Local checks passed 575 API, 372 web and 19 affected browser
scenarios, with final targeted rebuild/lookup checks. PostgreSQL runtime coverage
must pass CI before deployment. Validate links/statuses, whitespace, remote parity
and a clean tree at closure.

Origin inspection confirmed develop `2efa4aa` and no existing remote IOP-242 story
branch. Railway targets IOP-development/development with separate iop/database
services and automatic deployment enabled; HTTPS initially serves `732f9fe`.
A fresh protected custom PostgreSQL archive (32,434,036 bytes) was retained
privately. Its signature, SHA-256 and required table-data archive entries were
verified; all 62 table counts and 175 imports across May–November 2026 were stable
during export. No restore or remote business write was performed.

## Publication and live verification

- Authorization commit `98150e9` merged into develop as `15f954d`. The merge tree
  equals the story tree and application inputs equal validated implementation
  `0bd0295`. Both named refs were pushed atomically and independently verified
  through `git ls-remote`.
- [Run 44908167317](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/44908167317)
  passed complete Linux validation, all four container builds, synthetic Railway
  image checks and automatic deployment. API 575, web 372, database 340 and all
  130 browser scenarios passed. The real PostgreSQL reporting-workspace suite
  includes the new bounded search, exact short code, literal match, duplicate
  context, source isolation and access checks. No guard was bypassed.
- On 2026-11-21, independent HTTPS verification returned exact revision
  `15f954d33568b02cad73910098d6fbede0475c55`. Web/API smoke checks passed;
  anonymous business reads and the new equipment-search POST require authentication.
  Served entry/analytical assets include Find equipment, the lookup route and
  autocomplete presentation (`Workspace-pfoNb3k5.js`).
- The existing `equipment-quick-access.spec.ts` ran against the hosted frontend
  with intercepted fictional business API responses: 3/3 passed in 16.1 seconds,
  exit 0. Scenarios cover 1440 px English/light, 375 px German/dark and 320 px
  English/light, no eager report, cancel/focus restoration, duplicate code contexts,
  explicit keyboard selection, cross-year months and subsequent filter edits.
  Manually inspected hosted desktop result and mobile search captures. These
  scenarios did not log into or mutate the live business dataset.
- Separate read-only comparison confirmed unchanged counts across all 62 tables
  and unchanged 175 imports across May–November, including 16 November dates.
  Protected archives, manifests, CI logs and hosted screenshots remain private
  under ignored `.railway/` paths. No restore was performed.

## Closure

Item/backlog mirror verified publication and this plan is archived. The final
documentation-only increment is committed on the story and integrated/pushed
through the same approval. Application sources remain identical to the live
`15f954d` release; final ref hashes are reported in the completion message.
Verify links/statuses, whitespace, source equality, remote parity and a clean tree.
Preserve all review branches; no additional runtime deployment is required.
