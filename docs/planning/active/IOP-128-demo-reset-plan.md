# IOP-128 — Demo reset plan

Status: Blocked; documentation increment validated. Owner requested IOP-128 on 2026-09-26, limited to the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-128](../items/IOP-128-demo-reset.md).
Branch: `docs/IOP-128-demo-reset`, based on initially clean `develop`.
The first branch attempt was sandbox-denied; the plan file was created before
the successful elevated retry. All subsequent edits and the commit use the story branch.

## Changes and steps

1. Inspect IOP-123/125 dependencies, existing migration privileges, RAW retention
   and singleton quota semantics. Both direct dependencies are delivered on develop;
   production OIP storage and importer/host composition remain unavailable.
2. Propose the bounded reset authority and cross-module cleanup in ADR-0029.
   Existing insert-only seeds and runtime import permissions do not authorize it.
   Pause dependent implementation until acceptance under ADR-0007.
3. Translate the entire IOP-128 story to English, preserving its POC acceptance
   and links; record actual blockers. Dependency stories are already English.
4. Synchronize backlog and add a short delivery-map handoff. Expected files are
   this plan, the story, backlog, delivery map and the new ADR only.

No database mutation, new runtime permission, reset command, adjacent story
implementation, deployment or fixture replacement is part of this design increment.

## Validation and evidence

Check changed Markdown links, unique ADR ID, story/backlog status agreement,
English translation completeness and `git diff --check`. Review the proposal
against ADR-0019/0022/0027 and the existing import migration. No executable reset
exists; do not claim runtime tests or completed recreation.

After acceptance, plan implementation files and real PostgreSQL checks before
editing code: exact-target refusal, runtime denial, competing imports, rollback,
quota consistency, foreign-target preservation and recreation against IOP-125.

## Closure

Validation on 2026-09-26: `git diff --check` passed; a Python standard-library
check verified all 208 local link targets in the five changed Markdown files,
unique ADR-0029 and matching Blocked story/backlog status. Manual review verified
complete English translation and preservation of the story's acceptance criteria.
No code changed, so application tests were not run. Reset/runtime evidence remains
pending. The proposal preserves ADR-0022 retention and ADR-0027 quota/atomicity
requirements without claiming that migrator reset policies already exist.

Commit the validated documentation increment. Keep this plan active and IOP-128
Blocked while ADR-0029 acceptance, the concrete quiescence implementation plan and
the executable storage/importer dependencies remain outstanding.
Move to completed only after the reset and recreation criteria have actual evidence.
