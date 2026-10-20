# IOP-220 — Approved publication

Status: In progress, 2026-10-20.
Story branch: `fix/IOP-220-record-title-alignment`, implementation `d84f8ce`.
Scope: [permanent item](../items/IOP-220-record-title-alignment.md).

## Authorization and steps

The owner explicitly approved merging the story into `develop` and pushing both
branches to `origin` under ADR-0008. This slice records publication evidence only;
application changes remain the validated title-alignment implementation. Preserve
IOP-219 and all other review branches/worktrees. Deployment and stage/master
promotion are outside this approval.

1. Verify clean story/integration worktrees and fetch origin. Check develop ancestry
   and identify any remote changes before integrating; never force-push or rebase.
2. Commit this authorization on the story branch and merge it into develop in a
   separate worktree. Verify merge ancestry and application-tree equality against
   the validated implementation; existing test evidence applies if unchanged.
3. Record integration evidence, archive this plan and synchronize item/backlog.
   Merge the documentation increment into develop, then push both branches atomically.
4. Independently verify remote refs and clean worktrees; report final hashes.

## Validation and evidence

Pending: fetched baseline, integration hashes, changed-document link/status checks,
whitespace/conflict-marker review, application-tree comparison and remote parity.
Implementation validation: [execution evidence](../completed/IOP-220-record-title-alignment-plan.md).
