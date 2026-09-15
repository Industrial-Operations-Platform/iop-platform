# IOP-008 — Time and time-zone evaluation plan

Source specification: [IOP-008](../items/IOP-008-time-and-timezone-model.md).

## Status and authorization

Completed — evaluation/proposal slice only. The owner requested option evaluation,
an ADR and documentation updates if accepted. No temporal decision has yet been
accepted; parent IOP-008 remains In progress for decision review and acceptance
documentation. This finished evaluation record does not close the parent task.
Branch: `docs/IOP-008-time-and-timezone-model`, created from `develop` at `520471b`.
IOP-007's separate review branch is preserved and is not a prerequisite.

## Proposed implementation

Documentation-only evaluation of UTC instants, site time zones, source timestamps,
reporting periods, overnight shifts and daylight-saving ambiguity. Translate the
worked item into English. Keep the analytics-only v1 boundary and unknown source
period semantics explicit. Produce Proposed ADR-0016; ADR-0015 is already allocated
on the IOP-007 review branch. Do not infer acceptance or implement deferred shifts.

## Files expected to change

- This plan, moved to completed/ when the evaluation slice is validated.
- `docs/planning/items/IOP-008-time-and-timezone-model.md`.
- `docs/planning/backlog.md` (IOP-008 row only).
- `docs/architecture/adr/ADR-0016-time-and-timezone-model.md`.

Acceptance-dependent changes to `ARCHITECTURE.md`, data model, modules, glossary
and relevant ADR follow-up notes require a subsequent acceptance plan after the
owner accepts the concrete proposal. Parent IOP-008 remains open meanwhile.

## Dependencies and decisions

Read AGENTS.md, ARCHITECTURE.md, workflow, templates, modules, data model, glossary,
Accepted ADR-0001/0003–0008/0011–0014 and IOP-002 stack/backend evidence.
The requested `active/IOP-002-backend-stack.md` was migrated to permanent
`items/IOP-002-backend-evaluation.md`; current decisions are in its backend review,
stack item and Accepted ADR-0006. IOP-004 is integrated into develop.
CSV evidence does not establish the filename date's exact window or time zone.
Compare options explicitly because the seed item enumerates topics, not options.

## Database, API and UI changes

Semantic proposal only: no DDL, endpoints, dependencies, UI or implementation.
No library, ORM, source schema, payroll rule or identity/session choice.

## Tests and validation

Review official PostgreSQL, IANA and RFC documentation. Walk through normal and
DST overnight intervals, repeated/missing wall times, adjacent ranges, source
ambiguity, date-only aggregates, precision and historical zone changes.
Check relative links, unique ADR ID, statuses, English prose, branch base and
`git diff --check`. No runner exists; do not create test code for this design task.

## Implementation steps

1. Verify prerequisites and record plan before deliverable edits.
2. Compare options and write Proposed ADR with contracts and review scenarios.
3. Synchronize item/backlog, record validation and archive this finished slice.
4. Commit the scoped increment; present acceptance and push questions to the owner.

## Completion checklist

- [x] Options and temporal scenarios reviewed; proposal prepared.
- [x] Links, IDs, statuses and whitespace validated; limitations recorded.
- [x] Item/backlog synchronized; completed evaluation plan archived.
Local commit follows validation; owner acceptance and remote publication remain
separate pending decisions. The commit hash is recorded in Git and the delivery summary.

## Evidence and deviations

Initial branch creation was blocked by filesystem sandbox permissions; elevated
Git access successfully created the authorized story branch. No merge or push.


## Evaluation result and validation evidence

Delivered Proposed ADR-0016, the English permanent item and its matching In progress
backlog row. Recommendation: UTC instants, explicit IANA site/source context,
millisecond transport/storage, half-open resolved intervals and separate calendar
intent. No source reporting window or deferred feature was invented.

Reviewed the ADR scenario table against the accepted scope, source evidence and
PostgreSQL, RFC 3339, IANA and TC39 primary references on 2026-09-15. UTC/overnight
and DST examples were checked as design arithmetic against IANA Europe rules;
no runtime test was executed. Exact CSV boundaries remain unverified.

`git merge-base HEAD develop` returned `520471bdd89e20a6756f2809b790d44d7c114387`.
`git diff --check` passed. A one-off Markdown link scan checks all four changed
files after archival; local targets resolve. ADR-0016 is unique on this branch;
ADR-0015 remains reserved for the independent IOP-007 review. Item/backlog both
remain In progress, ADR remains Proposed, and accepted architecture files are
unchanged. No runner exists; no schema, application or test code was added.

Archived this finished evaluation slice under completed/. The subsequent acceptance
slice must first record explicit owner acceptance and its own plan before updating
accepted guidance. No scope deviations, merge, rebase or push.
