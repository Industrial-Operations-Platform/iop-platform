# IOP-215 — Approved publication evidence

Completed approved publication on 2026-10-20. The owner explicitly approved
pushing `develop`, `feature/IOP-215-operational-refinements` and
`feature/IOP-216-shell-branding` to `origin`.
Story branch: `feature/IOP-215-operational-refinements`, originally from `develop` `0df0299`.
[Permanent scope](../items/IOP-215-operational-refinements.md).

## Publication and checks

- Fetch confirmed origin/develop `0df0299` was an ancestor of local develop
  `aa9e664`; the two story refs were new on origin. Both source tips were already
  ancestors of develop with no pending commits.
- The approved atomic push succeeded for all three refs. Independent
  `git ls-remote` verified the published hashes:
  - develop: `aa9e6643fb19c4585344891abcddffc843be5dbc`.
  - IOP-215: `39ee71f5fd8a2ab745e04892bc966e0ab4d7ea95`.
  - IOP-216: `32b95b1599bdce9e26ca8debe413c0b9e28626da`.
- The application tree still matches tested combined merge `882e26a`.
  [Integration evidence](IOP-215-develop-integration-plan.md) retains the
  successful build/contract, 519 API, 231 web and 77 browser results. No application
  source changes or additional application test run are required for publication.
- Publication completion updates only this plan, the item and its backlog status
  on each retained story branch. These documentation commits follow the existing
  approved merge/push sequence into develop. Links, statuses, whitespace, indexed
  secret hygiene, unchanged application content, story ancestry and final remote
  parity are checked; final branch hashes are reported in the completion message
  rather than embedded in their own documentation commit.

This is repository publication only. Remote CI/deployment completion, real-provider
or plant acceptance is not claimed. No stage/master promotion, force push,
history rewrite or review-branch deletion is included.
