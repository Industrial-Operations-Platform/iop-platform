# IOP-141 — Story branches and review workflow

## Status

Completed

## Goal and authorization

The owner requests master as the principal branch, develop for integration, an
intermediate stage branch, and at least one temporary branch per story, including
documentation. The owner reviews and performs merges. Push requires explicit
permission requested at session end.

## Scope and acceptance criteria

- [x] Rename local main to master without rewriting existing commits.
- [x] Create develop and stage from the existing baseline.
- [x] Record story branch naming, review/promotion and commit/push rules.
- [x] Keep IOP-141 and IOP-001 changes on separate story branches.
- [x] Validate documentation and branch state; no merges or pushes.

## Constraints and validation

Follow ADR-0007 and the existing English authoring convention. Existing baseline
commits stay intact; do not redistribute old work or alter the remote default
branch. Verify references and branch tips locally. No application implementation.

## Execution

[Plan](../completed/IOP-141-branch-workflow-plan.md).
