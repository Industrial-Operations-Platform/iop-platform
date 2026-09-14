# IOP-003 — API contract evaluation plan

Source: [permanent item](../items/IOP-003-api-contract-strategy.md).

## Status and authorization

Completed — evaluation slice only. On 2026-09-14 the owner requested evaluation of API style/contracts,
an ADR, and dependent documentation updates if the decision is accepted.
This slice delivers a reviewable proposal; acceptance is not inferred.
Branch: `docs/IOP-003-api-contract-strategy`, created from clean `develop`.

## Proposed implementation

Compare REST, GraphQL and RPC against the accepted CSV analytics scope and
NestJS/React stack. Evaluate versioning, errors and contract ownership/evolution.
Complete the evaluation slice and leave IOP-003 awaiting owner acceptance.

## Files expected to change

- `docs/architecture/adr/ADR-0011-api-contract-strategy.md`: Proposed decision,
  alternatives, constraints, sources and review scenarios.
- `docs/planning/items/IOP-003-api-contract-strategy.md`: translate revised scope
  into English, record proposal and acceptance blocker.
- `docs/planning/backlog.md`: synchronize only the IOP-003 row.
- This plan, moved to `docs/planning/completed/` when the evaluation is validated.

Accepted architecture/contracts documentation will be updated only after explicit
acceptance, in a subsequent planned slice. No runtime files or adjacent items change.

## Dependencies and decisions

IOP-002 is Completed on develop; ADR-0006 accepts NestJS and ADR-0010 accepts
React and testing tools. Read ADR-0001/0003/0004/0005/0007/0008, architecture,
modules, conceptual data model, glossary and v1 scope.
The requested `active/IOP-002-backend-stack.md` does not exist; use the permanent
IOP-002 context and Accepted ADR-0006. The IOP-003 seed lists REST/other approach
without named alternatives; the comparison above makes those alternatives explicit.

## Database changes

None. Persistence schemas, ORM and physical tenancy remain undecided.

## API and UI changes

Proposed conventions only; no routes, schemas, client generation or UI implemented.
Identity/session design, source contracts and job infrastructure remain separate work.

## Tests and validation

Review primary documentation for protocol/framework capabilities. Check changed
Markdown relative file links, unique ADR ID, item/backlog/ADR status consistency,
English prose and `git diff --check`. Review success, invalid input, unauthorized
scope, contract evolution and incomplete analytical data scenarios in the ADR.
No runner exists; no runtime or generated-contract compatibility claims.

## Implementation steps

1. Verify prerequisites and primary sources.
2. Write the proposed ADR and synchronize item/backlog.
3. Review scenarios and links; record results and move this completed evaluation
   plan to completed while leaving the parent open for acceptance.
4. Commit the scoped increment locally; ask separately before any push.

## Completion checklist

- [x] Evaluation scope and scenarios documented.
- [x] Relevant documentation checks completed; limitations recorded.
- [x] Scope deviations recorded before dependent work.
- [x] Item/backlog updated and completed evaluation plan links fixed.

## Evidence and deviations

Initial working tree was clean on develop. Branch creation required sandbox
escalation for Git metadata and succeeded. No prerequisite branch integration
was needed. No scope expansion.


Final deliverables: Proposed ADR-0011, the English permanent IOP-003 context and
its synchronized Blocked backlog row. The ADR compares four API approaches,
three versioning approaches and three authoring approaches. Eight design scenarios
were reviewed against the proposed rules and Accepted ADR-0004/0005/0010.
No contradiction was identified; endpoint-specific metrics, limits and generator
compatibility remain deferred, not verified. The parent acceptance criteria remain
open; ARCHITECTURE.md and module guidance are unchanged pending acceptance.

Validation on 2026-09-14: `git diff --check` passed. A Python Markdown-link check
resolved all relative file targets in the four changed documents, including this
plan at its completed location. A status/ID assertion check confirmed one ADR-0011
file, Proposed ADR status, Blocked item/backlog status and a Completed evaluation
plan. The changed-file review is limited to the four planned files. Primary
sources are linked in the ADR; no runtime tests or commands were invented.
