# IOP-220 — Approved publication

Completed, 2026-10-20. Story branch: `fix/IOP-220-record-title-alignment`.
Scope: [permanent item](../items/IOP-220-record-title-alignment.md).

## Authorization and integration

The owner explicitly approved merging the story into `develop` and pushing both
branches to `origin` under ADR-0008. This slice changes publication evidence only;
application behavior remains the validated title-alignment implementation `d84f8ce`.
IOP-219 and other review branches/worktrees are preserved. Deployment and stage/master
promotion are outside this approval.

Fetch confirmed local and remote develop at `efddf8f`, with no divergence.
Authorization was committed as `5dc953c`. The story merged into develop as `52885a0`
without conflicts in `/private/tmp/iop-220-develop-publication`. Both worktrees were
clean, and the story tip is an ancestor of develop.

The integrated application tree equals `d84f8ce`; differences are publication
records only. Existing [implementation validation](IOP-220-record-title-alignment-plan.md)
therefore applies unchanged: production build, 28 feature/design tests, 9 shared
component/appearance tests, 26 architecture checks, 6 existing browser regressions
and 4 title-geometry scenarios across desktop/narrow widths and both appearances.

## Publication and closure

The atomic push succeeded. Independent `git ls-remote` verified develop
`52885a0139496b64dbdeeccf83fd9652abeb28de` and the story
`5dc953c5214a1197500d3049b6b865f6a8c9bfe9` on origin.

This completion increment archives the plan and synchronizes the item/backlog and
implementation-evidence link. It follows the same approved merge/push sequence;
changed-document links/statuses, whitespace/conflict markers, application equality,
ancestry, final remote parity and clean worktrees are checked at closure. Final
hashes are reported outside their own commits. The original worktree remains on
IOP-219 at `9f7fef7`; no local application activation was requested or performed.
