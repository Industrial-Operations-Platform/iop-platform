# IOP-004 — Scope acceptance and closure plan

Source: [permanent item](../items/IOP-004-platform-scope-model.md).

## Status and authorization

Completed — documentation acceptance slice. On 2026-09-15 the owner explicitly accepted ADR-0012 and authorized
merging the story into develop and pushing to origin. Continue on the existing
`docs/IOP-004-platform-scope-model` story branch, originally created from develop.
The evaluation commit is `57526df`; the starting working tree is clean.

## Proposed implementation

Record acceptance, synchronize the logical Organization/Site model and close the
design item. Preserve the completed evaluation as historical proposal evidence.

## Files expected to change

- `docs/architecture/adr/ADR-0012-organization-site-scope.md`
- `ARCHITECTURE.md`
- `docs/architecture/modules.md`
- `docs/architecture/data-model.md`
- `docs/product/glossary.md`
- `docs/planning/items/IOP-004-platform-scope-model.md`
- `docs/planning/backlog.md` (IOP-004 row only)
- This plan, moved to completed after validation.

## Dependencies and decisions

ADR-0012 acceptance is explicit. Accepted module, identity, isolation and API
boundaries remain in force. Physical tenancy, RBAC details and temporal mechanics
stay with their existing stories; no adjacent implementation is authorized.

## Database changes

Conceptual model only; no schema or persistence enforcement implementation.

## API and UI changes

Scope contract documentation only; no endpoint or UI implementation.

## Tests and validation

Check relative links, ADR/item/backlog statuses, acceptance criteria, scope
consistency and `git diff --check`. Review the changed-file list. No application
runner exists. Fetch origin before integration, preserve review branches and verify
published branch hashes after the authorized push; never force push.

## Implementation steps

1. Record acceptance and synchronize architecture, modules, data model and glossary.
2. Close the item/backlog and archive this plan with documentation evidence.
3. Commit the coherent documentation increment locally.
4. Fetch origin, merge the story into develop and push both authorized branches.

## Completion checklist

- [x] Acceptance and dependent documentation synchronized.
- [x] Documentation validation completed and item/backlog closed.
- [x] Plan archived with evidence and limitations.

## Evidence and deviations

No scope expansion. Merge and push are explicitly authorized in this turn;
publication results will be reported to the owner after execution.


On 2026-09-15, acceptance was synchronized across ADR-0012, the architecture
baseline, modules, conceptual data model, glossary and IOP-004 item/backlog.
All three item criteria are satisfied as design. The prior evaluation plan remains
unchanged as historical evidence. Review confirmed scope identity, ownership,
permission separation, missing-scope denial and deferred physical enforcement
are consistent with the accepted ADR. No new implementation decisions were added.

Validation: relative file links resolved in all eight changed documents at their
final paths; one ADR-0012 exists with Accepted status; item/backlog are Completed
and all item criteria are checked. `git diff --check` passed. The changed-file
review matches this plan. No application tests exist or runtime checks were run.
Git integration/publication follows this completed documentation increment; its
result is verified separately against the branch hashes and reported to the owner.
