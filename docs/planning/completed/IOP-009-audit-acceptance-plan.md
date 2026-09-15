# IOP-009 — Audit design acceptance and pilot deferral

Source: [IOP-009](../items/IOP-009-audit-model.md).

## Status and authorization

Completed. The owner explicitly accepted the audit design while stating that it
is unnecessary for the pilot and should remain planned for later. This authorizes
design synchronization and pilot deferral, not implementation or publication.
Continue on `docs/IOP-009-audit-model`, the existing story branch created from
develop; the working tree was clean at `abc0243`. No new story or merge is needed.

## Scope and files

Record ADR-0017 as Accepted for future implementation, with its audit requirements
and retention defaults excluded from pilot release gates. Close the design item.
Update ADR-0017, ARCHITECTURE.md, modules, data model, glossary, product scope,
IOP-009 item/backlog and this plan. Add a pilot-deferral pointer to IOP-023 without
starting or changing its future implementation requirements. Clarify ADR-0014's
audit-delivery applicability through a subsequent decision note, preserving RBAC.
The owner's comparison with login does not select a different authentication model
or authorize changes to the separate IOP-007 branch.

## Dependencies and changes

Accepted scope, isolation, RBAC and temporal decisions remain the design foundation.
No database, API, UI, infrastructure or runtime changes. No push authorization.

## Steps and validation

1. Record acceptance and its future-only applicability in the ADR.
2. Synchronize architecture/product/planning references and design completion.
3. Check changed links, status consistency, pilot deferral and whitespace.
4. Archive this completed plan and commit the coherent documentation increment.

## Completion checklist

- [x] Acceptance and pilot exclusion recorded consistently.
- [x] Item/backlog complete as design; implementation remains future work.
- [x] Links, statuses and diff checks verified; evidence recorded.
- [x] Plan archived and changes prepared for local commit.

## Evidence

`git diff --check` passed. Reviewed changed Markdown links against existing
ADR-0017, scope, item and completed-plan paths. `rg` review verified Accepted ADR
status, Completed IOP-009 item/backlog and explicit pilot deferral throughout the
architecture and product documents. IOP-023 remains Proposed, with a future-only
applicability note; no implementation story was started. Reviewed the diff for
scope and preserved the previous proposal record as historical evidence.

No runtime tests apply to this documentation-only increment. No application,
identity or infrastructure files changed. No merge or push performed. The plan
is archived under completed/ for the local acceptance commit.
