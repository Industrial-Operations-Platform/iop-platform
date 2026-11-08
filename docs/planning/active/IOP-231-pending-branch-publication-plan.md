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

## Integration evidence

Initial inventory: 17 retained local refs (including this review branch) and 160
origin story refs. Only the older navigation and historical transfer tips lacked
ancestry in develop. The navigation merge `78412f3` retains the approved current
versions in six overlapping files; its resulting tree is unchanged. Transfer
merge `a8dac1e` adds only the existing 36-line historical note. Both original branch
tips are now ancestors of this review branch, alongside every other retained tip.
IOP-226's backlog mirror was reconciled with its existing Completed/published item.

## Pre-publication validation

- Application, scripts, infrastructure, configuration and package trees match
  validated `7ad6b01` exactly; no behavioral retesting is required for these
  ancestry/documentation-only merges. IOP-230 records the successful build,
  319 web unit tests and 35 browser scenarios for that identical application.
- All 178 retained local/origin refs checked (excluding origin HEAD/stage/master)
  are ancestors of the consolidation tip.
- `node scripts/check-secrets.cjs` passed for 1473 indexed files (bounded rules).
- 252 changed-document local link targets resolved; `git diff --check` passed.

Ready to commit this record, fast-forward local develop and publish the 17
explicit local refs atomically to origin. Only five refs differ or are new:
develop, this review branch, the logo branch and both navigation branches.
