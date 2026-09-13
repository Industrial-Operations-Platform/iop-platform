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
