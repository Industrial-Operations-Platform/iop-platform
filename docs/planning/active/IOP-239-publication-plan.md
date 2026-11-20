# IOP-239 — Approved remote integration and Railway verification

Status: In progress. Story branch: `feature/IOP-239-single-equipment-analysis`.
[Scope](../items/IOP-239-single-equipment-analysis.md) and
[implementation evidence](../completed/IOP-239-single-equipment-analysis-plan.md).

## Authorization and steps

On 2026-11-20 the owner approved integrating this story remotely and verifying
that Railway updates. This authorizes merging the reviewed story into develop,
normal pushes of both branches to origin and the existing development deployment.

1. Fetch/check origin tips, inspect the configured Railway development target and
   retain a fresh private remote PostgreSQL backup before the application push.
2. Commit publication authorization on the story branch, merge into develop and
   push only the named story/develop refs atomically. Preserve existing data and
   every other review branch; no stage/master promotion or history rewriting.
3. Observe the existing GitHub Platform validation and automatic Railway workflow;
   inspect any failure without bypassing validation. Verify the exact live build
   revision, HTTPS/access smoke checks and delivered single-equipment frontend.
4. Record remote hashes, CI/deployment evidence and data-preservation checks.
   Synchronize this plan, item and backlog; commit and publish the documentation
   closure through the same approved story/develop sequence.

## Files and validation

Only this publication record, the IOP-239 permanent item and backlog need tracked
edits. Private operational helpers, backups and diagnostics stay under ignored
`.railway/`. Reuse the completed implementation's tests; verify source-tree
equality through integration, links/statuses, whitespace, remote ref parity and
the Railway revision. A health response alone does not establish the new release.

Initial inspection: working tree clean; story `728da6f`, local and origin/develop
`3afbd71`. Origin has no IOP-239 story branch yet. No unrelated changes are pending.

Pre-publication inspection confirmed project IOP-development, environment
development, separate iop/database services and `RAILWAY_AUTO_DEPLOY=true`.
HTTPS initially serves revision `8753515`. A fresh NTFS-protected PostgreSQL custom
archive (32,435,220 bytes) was retained under ignored `.railway/backups/`; its
signature, SHA-256, required table-data entries and remote archive listing were
verified. The private manifest records all 62 table counts and 175 analytical
publications across May–November 2026, including 16 November imports. Counts were
unchanged during export. No isolated restore was performed and no remote data was
written or restored.

## Validation refinement

The first push merged as `9a042bf` and published both approved refs. Run
[44676743610](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/44676743610)
passed API (573), web (352), database (340), secret/contract checks and 121 browser
scenarios. One new browser assertion failed because it inspected the pinned daily
request synchronously after observing the weekly request, before the asynchronous
daily read had started. No application failure or deployment was observed.

Correct only that assertion in `apps/web/e2e/single-equipment-analysis.spec.ts` to
wait for the pinned request with Playwright polling, retaining all value/revision
assertions. Repeat the targeted browser tests and publish the story fix normally.
Since this follow-up changes tests/docs only, its push will not automatically
deploy the already-published runtime changes. Dispatch the existing full workflow
on develop with `deploy=true`; cancel only the redundant push-triggered run for
the same new SHA. The manual run must pass every existing validation/deployment
guard. Application code remains identical to implementation `728da6f`.

The corrected single-equipment scenarios passed three repetitions each: 9/9
browser tests, exit 0 (32.2s), at 1440px English/light, 375px German/dark and
320px English/light. The change is one asynchronous assertion, not a relaxed
value/revision requirement or a fixed delay.
