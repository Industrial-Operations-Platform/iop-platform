# IOP-001 — Personas and pilot workflow execution plan

Source specification: [IOP-001](../items/IOP-001-v1-personas-and-pilot-workflow.md).

## Status and authorization

In progress. The user requested IOP-001, an execution plan and no implementation.
Current branch: docs/IOP-001-v1-analysis-scope. The latest owner-confirmed scope
is analytics-only v1, as recorded in the final execution-slice section below.
Earlier locator statements are retained as superseded decision history.
All new project content is written in English. The separately requested language
rule is tracked by IOP-140; it does not change this item's product scope.

## Proposed implementation

Documentation only: define a reviewable Technician, Team Leader and Administrator
persona baseline, one end-to-end pilot scenario, its scope and acceptance evidence.
Explicitly distinguish proposed assumptions from stakeholder-validated requirements.

## Files expected to change

- This plan and the permanent IOP-001 context (translate it into English).
- AGENTS.md: explicitly requested commit-completion preference, recorded before editing.
- docs/product/personas-and-pilot-workflow.md (new proposed baseline).
- docs/product/scope-v1.md (record the owner-confirmed v1 boundary).
- ROADMAP.md and backlog overview (distinguish v1 from future product inventory).
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


## Owner clarification: current workflow and v1 responsibilities

Before further edits, record the authorized refinement: the owner is the sole
project developer and currently uploads a stable-format WinCC CSV. An existing
Python script formats it and loads a local database for local Power BI reports.
IOP v1 must reproduce the import → analysis → asset-location workflow with
individual logins and appropriate views. Team Leaders analyze/present to a superior
and also need location context; Taskforce investigates faults and exact locations.
Workforce, maintenance and handover are outside v1, not merely outside a first demo.
Future direct WinCC-source access remains a read-only integration to investigate.

Update personas, current-state evidence and release-scope documentation accordingly.
Do not inspect or alter the existing Python/database/Power BI workflow in this step.
Continue responsibility questions one at a time before discussing data or metrics.
The superior's access was subsequently clarified: receives Team Leader presentations
only, with no direct IOP login in v1. Map/asset maintenance ownership remains open. This clarification does not accept an RBAC matrix or backend stack.


## Latest authorized refinement and commit workflow

The owner clarified that Taskforce handles the most serious operational problems
and needs the full automated analysis and location drill-down, from a configured
sector to an individual sensor. Team Leaders need the same analysis/location
capability to help with investigation. This is shared read/investigation capability,
not permission to edit assets or bypass customer/site scope. Sector and sensor are
configurable location/asset concepts, not mandatory fixed hierarchy levels.

Management consumes Team Leader presentations only; no management login is needed
for v1. Reflect these confirmations in the product proposal, item and scope.
The owner also explicitly requests committing authorized, validated changes without
waiting for a separate commit request. Add that working preference to AGENTS.md;
include prior pending IOP-001 documentation in the commits. Do not push or infer
acceptance of Proposed ADRs. Continue one responsibility question at a time.


## Current execution slice: analytics-only v1

Branch: docs/IOP-001-v1-analysis-scope, independently based on develop at 7009d40.
The owner revised v1 to reproduce the current Power BI analytical workflow because
surveying the entire plant and locating every sensor is substantial separate work.
This supersedes earlier locator-as-v1 confirmations in this plan's history.

Before edits, record the authorized changes: update personas/workflow, scope-v1,
this item and plan, roadmap, backlog overview and milestone scope notice. V1 is
CSV → preparation/normalization → analysis → presentation. Keep individual login
and authorized views; use source-provided sector/equipment references when available.
Do not require a surveyed asset registry, sensor coordinates, maps or Asset Locator.
Precise location/3D visualization is a future goal without selected technology.
Meetings, shifts and other platform workflows are later scope; their order is open.

Validation: local links, whitespace, consistent current v1 boundary and no application
changes. Commit this slice without merging or pushing. IOP-001 remains open for
responsibilities, reporting requirements and acceptance targets. The independent
IOP-141 governance branch is awaiting owner review; it is not merged into this branch.


Latest slice verification: all local Markdown links resolve; git diff --check passes;
ADR-0006 remains Proposed and future application directories contain only .gitkeep.
Current product scope, workflow proposal, item, roadmap and index consistently defer
Asset Locator/surveys. Historical plan notes and future backlog contexts are preserved.
No merge, push, application implementation or runtime test was performed.
