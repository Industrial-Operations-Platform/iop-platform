# IOP-028 — Local authentication adapter

## Status

Completed — original outcome delivered in later owner-authorized local increments;
reconciled on 2026-10-06.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). The original disposition is superseded by the delivered local increment below.

## Milestone

M3 — Platform Core. Delivered local slice.

## Goal

Implement local login only if selected for later shared use.

## User / business value

Administrators and users need access to authorized organizations and sites.

## Context

Scope: Platform Core, Authentication and Users/RBAC. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog inclusion does not authorize implementation.

## Current state

Local login, logout, Argon2id credentials, mandatory password change and revocable
sessions are delivered under Accepted ADR-0035 and IOP-165. Corporate identity and
remote deployment remain separate scope.

## Desired state

Implement local login only if selected for later shared use.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- The original analytical-only POC did not require login. The owner later selected
  and accepted ADR-0035; IOP-165 delivers the local password/session adapter.

## Acceptance criteria

- [x] Implement local login only if selected for later shared use.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Organization represents the generic customer/tenant; identity, membership and
permissions have separate responsibilities.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt a decision.

## Security considerations

Verify permission and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes when applicable.

## Data considerations

Preserve scope in entities and relationships; define uniqueness and lifecycle before migrating.

## API considerations

Public operations must verify identity, permission and scope; do not expose unauthorized
operations during bootstrap.

## UI considerations

Show only permitted scopes and clear access errors; hiding controls does not replace authorization.

## Dependencies

[IOP-007](IOP-007-authentication-model.md), [IOP-027](IOP-027-user-model.md), [IOP-018](IOP-018-configuration-management.md).

These are future parent dependencies, not POC gates. Any minimal local seed slice
uses an accepted execution-context contract rather than requiring the full parent.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding
delivery to the whole milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the criteria using accepted
tooling. Include the expected path, errors and relevant access denial; record actual
results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

None for the delivered original outcome. Broader parent capabilities remain
separately scoped and require an explicit selection before implementation.

## Current coverage — 2026-10-06

Local login, logout, Argon2id credentials, mandatory password change and revocable
sessions are delivered under Accepted ADR-0035 and IOP-165. Corporate identity and
remote deployment remain separate scope.

Implementation and validation: [execution evidence](../completed/IOP-165-transitional-access-plan.md).
No remaining implementation for this story’s original outcome; broader scope remains
in the explicitly linked parent stories. Closure does not imply platform release
or final owner product acceptance.
