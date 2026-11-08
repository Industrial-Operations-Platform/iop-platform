# IOP-231 — Pending branch consolidation and publication

In progress. Authorized by the owner's 2026-11-08 request to integrate and publish
all pending branches. Review branch: `docs/IOP-231-pending-branch-publication`,
created from clean develop at `7ad6b01`.
[Permanent scope](../items/IOP-231-pending-branch-publication.md).

## Changes and steps

1. Fetch origin and inventory local/remote tips, ancestry and publication parity.
   The initial develop is seven commits ahead of origin, with no remote divergence.
2. Merge `fix/IOP-230-collapsed-navigation` to retain its original review ancestry.
   Its functionality was replayed and superseded on the logo-based motion branch;
   retain the validated current application/docs in overlapping conflict hunks.
   Merge `local/home-data-transfer-20261030`, whose final unique tree content is
   `output/TRANSFERENCIA-IOP.md`. Preserve that pre-existing historical owner note
   unchanged; it is not a current instruction or a new data transfer.
3. Keep all other branch tips already integrated. Synchronize the IOP-226 backlog
   mirror with its read Completed item, and record publication authorization for
   IOP-229/230. Expected edits are planning contexts, backlog and this plan;
   integration should not change current `apps/` code.
4. Verify final apps tree against `7ad6b01`, ancestry, indexed secret hygiene,
   Markdown links and whitespace. Reuse the identical application's 319 web unit
   tests, 35 browser scenarios and successful build recorded in IOP-230; run new
   behavioral checks only if integration changes application content.
5. Commit on the review branch, fast-forward develop, atomically push explicit
   retained local refs to origin and verify every remote hash. Commit the verified
   publication record on this branch, fast-forward/publish the documentation
   closure and verify final parity, ancestry and clean develop checkout.

No force push, history rewrite, branch deletion, stage/master promotion or operator
database action. Read IOP-197/223/226/229/230 contexts are English; no story
translations are required. Publication is explicitly authorized; do not ask again.

## Initial evidence

`git fetch origin` succeeded. Outstanding local ancestry consists of the older
IOP-230 review branch (`63ec153`) and the historical transfer branch (`08318de`).
The latter's current 36-line note contains operational history and private backup
locations, not credential values; that branch already exists on origin. Its
historical transfer launcher is deleted in its final tree and must stay deleted.
