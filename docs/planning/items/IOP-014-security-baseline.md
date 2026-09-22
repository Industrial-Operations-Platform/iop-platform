# IOP-014 — Define the local POC security baseline

## Status

Completed — local POC design documented and reviewed on 2026-09-22.
No runtime security implementation or ADR-0018 acceptance is claimed.

## POC delivery applicability

The owner-approved refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15, selects the [local POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). Completion covers this bounded design only;
shared-use security and deferred implementation stories remain outside it.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal and business value

Define the local POC trust boundary and minimum input/configuration controls so
local bootstrap and CSV/analytics delivery have concrete safety requirements.

## Context and current state

The owner requested IOP-014 with [IOP-016](IOP-016-backend-bootstrap.md) as context.
That completed host provides loopback process health, PORT validation and sanitized
failures; it has no business access or persistence. The
[local security baseline](../../architecture/security-baseline-poc.md) now defines
control requirements and future verification scenarios for the selected POC.
See [modules](../../architecture/modules.md), [data model](../../architecture/data-model.md)
and [workflow](../workflow.md) for the retained boundaries.

## Desired state and requirements

- Dedicated local operation for one trusted operator, without shared/public hosting.
- Secret exclusion and validated, scoped configuration with safe failure behavior.
- Bounded CSV/request handling, safe interpretation and explainable rejected input.
- Explicit scoped access preserving permissions, references, constraints and RLS.
- Login/session, corporate identity and external-integration security remain later
  work. Proposed ADR-0018 requires acceptance before dependent runtime access;
  this baseline neither accepts its mechanism nor removes authorization/RLS.

## Acceptance criteria

- [x] Define the local POC trust boundary and minimum input/configuration controls.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent
  with unfinished future scope.

## Domain and architecture constraints

Keep identity, permissions, scope and providers separate. Customer labels and source
schemas belong in scoped configuration/adapters, outside the generic core.
Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md),
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md),
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md),
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md) and
[ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md) remain in force.
No new architectural pattern or accepted decision is introduced.

## Security and data considerations

The baseline covers dedicated storage/reset targets, untrusted browser/CSV input,
secret-free diagnostics, source provenance and scope on stored/derived data.
Only synthetic fixtures belong in version control; authorized reference data remains
outside it. No schema, migration, seed, input data or production secret is added.
Local operation cannot claim isolation from privileged operators or local processes.

## API and UI considerations

No endpoints, guards, UI or runtime limits are implemented. The baseline requires
finite budgets and boundary tests in each delivering contract, safe text rendering,
bounded errors and origin/host verification before business mutations are enabled.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md) and
[IOP-005](IOP-005-tenancy-and-data-isolation.md) are Completed as design and
integrated on develop. Their relevant POC contracts suffice for this baseline.
IOP-016 supplies existing host context; IOP-018 consumes this configuration safety
baseline and remains its own delivery task. IOP-007 sessions are not a prerequisite.

Runtime business access still requires acceptance of
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) or another
mechanism. This independent design does not need that pending decision to complete.

## Non-goals

Application code, migrations, endpoints, infrastructure, identity/seed mechanisms,
login/session design, live integrations, full audit/retention and production or
shared-user operating controls. No neighboring story is activated or completed.

## Validation and evidence

The [completed plan](../completed/IOP-014-security-baseline-plan.md) records document
link/status checks and review of positive/negative scenarios against the POC and
accepted dependencies. The baseline explicitly distinguishes future runtime evidence
from this design review. No application or security tests ran in this documentation
slice; prior IOP-016 evidence remains with that story.

## Documentation impact and open implementation questions

The baseline, this permanent item, backlog, POC discovery links and completed plan
are synchronized. No design-closure question remains for this selected slice.
Exact numeric budgets, importer cleanup/transaction behavior, origin/host controls,
configuration loading and executable RLS evidence belong to their delivery plans.
The local execution mechanism remains Proposed; all dependent runtime work waits
for its acceptance or an accepted alternative.
