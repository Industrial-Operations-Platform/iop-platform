# IOP-002 — Technology stack decision plan

Source specification: [IOP-002](../items/IOP-002-technology-stack.md).

## Status and authorization

In progress — awaiting backend decision. The prior user request authorized backend
evaluation and an ADR, with documentation updates conditional on acceptance. This
plan was created during IOP-139 to separate preserved research from future work;
it does not claim a plan existed before the original evaluation.

## Proposed implementation

Documentation-only backend evaluation slice. The broader item's frontend/tooling
selection needs a subsequent explicitly requested slice. No code implementation.

## Files expected to change

IOP-002 context/evidence, ADR-0006, ARCHITECTURE.md, README.md and planning status
when the decision is accepted or the user requests a revision.

## Dependencies and decisions

Foundational ADRs remain accepted. IOP-001 product priorities and team experience
are assumptions to validate; ADR-0006 recommends NestJS but remains Proposed.

## Database, API and UI changes

None. No scaffolding, ORM, identity provider or frontend decision is included.

## Implementation steps

1. Preserve the [completed comparison](../items/IOP-002-backend-evaluation.md).
2. Await explicit acceptance or requested revision of ADR-0006.
3. On acceptance, synchronize accepted stack documentation; otherwise revise scope
   and recommendation as requested. Do not implement the backend.
4. Record validation and archive this slice's plan once its deliverables are met.
   Keep IOP-002 open until the rest of the stack/tooling criteria are satisfied.

## Tests and completion checklist

- [x] Eight criteria compared with sources and assumptions.
- [x] Proposed ADR produced; readable comparison preserved.
- [ ] User's backend decision recorded and corresponding documentation synchronized.
- [ ] Recheck links/statuses and move finished slice plan to completed/.

## Evidence

Prior commits a44628a and dd51b63 contain the evaluation and navigation updates.
IOP-139 migrates paths only; it does not accept ADR-0006. No runtime tests exist.


## Current review slice

Branch: docs/IOP-002-backend-review, based on 881daf2 from the IOP-001 story,
explicitly requested by the owner. Review this slice against that parent commit;
review/merge IOP-001 first when integrating into develop. No merges performed.
The five previously approved branches were pushed to origin. This new branch is
not included in that push authorization and must be offered for publication later.

The old active/IOP-002-backend-stack.md was migrated to
items/IOP-002-backend-evaluation.md. Read that evidence rather than recreating a
second task specification at the obsolete path.

Before edits: reassess FastAPI versus NestJS using the owner's clarified solo
team, existing Python CSV pipeline and analytics-only v1. Preserve the original
evaluation as historical evidence; write a current review and revise the still
Proposed ADR-0006 if justified. Translate the touched permanent item into English.
Update architecture's proposal pointer and backlog status, not accepted foundations.

Expected files: this plan, IOP-002 context, prior evidence status, new
items/IOP-002-backend-review.md, ADR-0006, ARCHITECTURE.md and backlog.md.
The broad IOP-002 item cannot be closed until its backend decision and remaining
frontend/tooling criteria are resolved. No fake dev/test commands or implementation.

Validation: official capability references, all eight criteria, assumptions and
counterarguments, local links, ADR sections/status, branch ancestry and whitespace.
Ask for missing experience/acceptance information and keep pending decisions explicit.


## Current review outcome

All eight criteria reassessed for analytics-only v1. The owner confirmed stronger
TypeScript/Node.js maintenance/debugging experience, so the current recommendation
is NestJS. FastAPI's data-workflow advantages were considered; existing-script reuse
remains unverified. Experience confirmation is not framework acceptance.
ADR-0006 stays Proposed and the parent item stays In progress. Await explicit
backend acceptance; frontend/tooling work remains outside this backend-only slice.


Validation completed: all local Markdown links resolve, the current review covers
eight criteria, ADR-0006 has the required sections and remains Proposed, and no
application directories contain code. Git diff --check passed. Remote verification
confirmed the five approved branch tips; this story starts at 881daf2 and remains
unpublished until separately authorized. No merge or runtime tests performed.
