# IOP-001 — Personas and pilot workflow execution plan

Source specification: [IOP-001](../items/IOP-001-v1-personas-and-pilot-workflow.md).

## Status and authorization

In progress. The user requested IOP-001, an execution plan and no implementation.
All new project content is written in English. The separately requested language
rule is tracked by IOP-140; it does not change this item's product scope.

## Proposed implementation

Documentation only: define a reviewable Technician, Team Leader and Administrator
persona baseline, one end-to-end pilot scenario, its scope and acceptance evidence.
Explicitly distinguish proposed assumptions from stakeholder-validated requirements.

## Files expected to change

- This plan and the permanent IOP-001 context (translate it into English).
- docs/product/personas-and-pilot-workflow.md (new proposed baseline).
- docs/product/scope-v1.md (link to the proposal, without claiming scope approval).
- docs/planning/backlog.md (IOP-001 status and English task label).

## Dependencies and decisions

Read AGENTS.md, ARCHITECTURE.md, ADR-0001–0007, vision and v1 scope.
ADR-0006 remains Proposed. No technology or identity-provider selection is needed.
Stakeholder workflow priority, persona responsibilities and measurable targets
need validation; draft independent documentation while those answers are pending. The owner has confirmed CSV events → analysis → locate the asset as
the first pilot priority.

## Database, API and UI changes

None. Describe user outcomes and access boundaries, not schemas, endpoints or UI
implementation. Do not turn personas into an accepted RBAC matrix.

## Implementation steps

1. Record this plan before editing the item or product documents.
2. Translate the existing item without expanding its scope; mark it In progress.
3. Draft personas, trigger/preconditions, main and failure flows, scope proposal
   and measurable acceptance scenarios with traceability to the item.
4. Ask the owner to validate pilot priority; mark unanswered details as open.
5. Check links, scope and ADR consistency. Record documentation-review evidence.
6. Incorporate stakeholder answers before marking requirements validated, updating
   accepted v1 scope or completing this item. Archive only after its criteria pass.

## Tests and validation

Check local Markdown links and whitespace. Review all three personas, the complete
scenario, scope-denial and missing-data cases, and source-data limitations against
the accepted ADRs. No runtime tests or implementation are authorized.

## Completion checklist

- [x] Persona and scenario proposal drafted with assumptions identified.
- [x] Owner confirms workflow priority: CSV events → analysis → locate the asset.
- [ ] Owner validates detailed persona responsibilities.
- [ ] Pilot acceptance measures and release scope agreed or explicitly deferred.
- [x] Documentation checked and actual review evidence recorded.
- [ ] Item/backlog synchronized; archive only after stakeholder validation.

## Evidence and deviations

Draft produced in English and revised to the owner-confirmed CSV → analysis →
locator priority. Maintenance/handover remain later workflows, not first-pilot
prerequisites. No implementation or architecture decision was added. Detailed
persona, data and success-target validation remains pending.


Documentation validation: local Markdown links resolve; git diff --check passes;
ADR-0006 stays Proposed; future code directories still contain only .gitkeep.
Reviewed all three personas, CSV/source-grain limits, ambiguity, missing placement
and scope-denial scenarios. These checks are not stakeholder acceptance or runtime
tests. The plan stays active pending detailed validation.
