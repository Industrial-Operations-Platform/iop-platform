# IOP-142 — Align delivery with a fast analytical POC

## Status

Completed

## Goal and authorization

On 2026-09-15 the owner accepted the scope review and requested repository changes:
deliver a local, single-operator CSV → analysis → presentation proof of concept
before login, external connections and the broader platform. Retain architectural
boundaries that prevent avoidable rework. This story implements documentation only.

## Requirements and acceptance criteria

- [x] Product scope, roadmap and milestones distinguish the POC from later shared use.
- [x] Relevant permanent stories have explicit POC slices and corrected dependencies.
- [x] Login, integrations, audit, workers and future operational modules are outside
  POC delivery gates; manual CSV ingestion remains in scope.
- [x] Preserve data integrity, scope, accepted stack and temporal semantics.
- [x] Document any new execution-context mechanism as Proposed, without silently
  weakening accepted authorization or RLS decisions.
- [x] Validate links, IDs, statuses and dependency consistency; commit locally.

## Context and dependencies

The reviewed [backlog](../backlog.md) contains future platform work and stale
dependencies despite the analytics-only product direction. IOP-001–006 and IOP-008
are completed design baselines on develop. Unmerged IOP-007 and IOP-009 branches
are review context only; this task does not merge or change their acceptance records.

## Architecture, security and data

Preserve Accepted ADR-0004, ADR-0012/0013/0014 and ADR-0016. Product authorization to
defer login does not select a technical replacement for identity verification.
The local execution contract in ADR-0018 was separately accepted on 2026-09-26;
runtime implementation and validation remain pending. Retain RAW provenance, scoped duplicate prevention and
reconciled frequency/duration semantics. No runtime isolation claim is made.

## API, UI and non-goals

Describe import, overview and detail delivery; no endpoints, code, schemas, hosting,
merges or pushes. Do not implement adjacent stories or reopen accepted stack choices.

## Validation and documentation impact

Check changed Markdown links, story IDs/statuses, dependency paths and whitespace.
Update product/planning navigation, affected item slices and architecture applicability.
Execution evidence belongs in the [plan](../completed/IOP-142-poc-delivery-scope-plan.md).

## Open questions

The local execution-context mechanism is accepted in ADR-0018. Import contracts,
duration parsing and representative reference totals are refined in their delivery
stories; none blocks this documentation increment.

## Completion evidence

Documentation alignment completed on 2026-09-15. The POC scope, inventory map,
30 story refinements and product/architecture navigation are synchronized.
Local-link, backlog-status/ID, inventory coverage and selected dependency-closure
checks passed; `git diff --check` passed. ADR-0018 remains Proposed. This completes
the requested documentation increment, not the POC or its runtime access decision.

## Local mechanism acceptance — 2026-09-26

The owner explicitly accepted ADR-0018 after review of its local-only principal,
explicit grants and retained RLS boundaries. The original alignment evidence above
records the proposal-era state. This acceptance resolves the decision gate, not
runtime delivery or IOP-096/097 completion. See the
[acceptance plan](../completed/IOP-142-local-context-acceptance-plan.md).
