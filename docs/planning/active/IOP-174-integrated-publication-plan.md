# IOP-172/174 integrated publication

Status: In progress. Integration branch: `fix/IOP-174-handover-navigation-layout`.
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
