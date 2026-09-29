# IOP-172/174 integrated publication

Status: Completed. Integration branch: `fix/IOP-174-handover-navigation-layout`.
On 2026-09-29 the owner approved integrating this branch and
`fix/IOP-172-department-summary-spacing` into develop, publishing all three refs
to origin and updating the local Docker installation.

1. Record a read-only live handover/history and analytics baseline, verify refs,
   merge IOP-172 into the IOP-174 integration branch and preserve both changes.
   Resolve only integration conflicts and synchronize story status/evidence.
2. Build and test the combined web app; run the existing Start and handover browser
   journeys at desktop/mobile widths. Check links, whitespace and secret hygiene.
3. Fast-forward develop and publish both story branches plus develop to origin.
   Run `npm run local:up`, preserving configuration, accounts and persistent volumes.
4. Verify service health, served assets and unchanged live-data digests/totals.
   Record outcomes, archive this plan and publish its completion record under the
   same approval. No stage/master promotion, reset or additional demo insertion.

Implementation evidence: [IOP-172](../completed/IOP-172-department-summary-spacing-plan.md)
and [IOP-174](../completed/IOP-174-handover-navigation-layout-plan.md).

## Publication and activation evidence

Merged IOP-172 (`ef77ec1`) into IOP-174 at `218926a`; only the backlog index needed
manual conflict resolution, retaining all completed items. Develop fast-forwarded
and all three approved refs were pushed to origin. This completion record is
published through the same story → develop path under the existing approval.

Combined web build and all 73 web tests passed. All four Start/handover browser
journeys passed at 1440 px and 375 px. Diff, documentation links and secret hygiene
passed. Logs: `/tmp/iop174-integrated-{build,tests,browser}.log`.

`npm run local:up` completed successfully; API, web and database are healthy.
The served JavaScript/CSS contain the new component labels, detail navigation,
matrix layout and summary spacing. Root and proxied API health return HTTP 200.
Runtime update log: `/tmp/iop174-local-update.log`.

Read-only before/after checks matched exactly: 63 entries (3 original + 60 demo),
129 immutable revisions (4 original + 125 demo), all snapshot/history digests and
application query results. Four users, four credentials and fourteen sessions were
preserved. Analytics remain 60,735 facts, frequency 316,864 and 79,968,310 seconds;
the optional source seed reconciled all 78 dates unchanged, with zero new imports.
Evidence: `/tmp/iop174-{before,after}-activation.json.log` and
`/tmp/iop174-access-{before,after}.log`. No reset or additional demo writes occurred.
