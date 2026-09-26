# IOP-109 — Secrets handling

## Status

Completed — local POC hygiene slice, 2026-09-26. Future production/shared-use
secret management is not included.

## Milestone

M14 — Security & Reliability. Controls accompany each delivered POC slice.

## Goal and business value

Keep secrets out of the repository and delivered public surfaces so operators can
reproduce the local demonstration without exposing credentials or production data.

## Context and current state

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
select basic secrets/configuration hygiene in delivered paths. IOP-018 already
validates local scope without credentials; database tooling uses separate local
role passwords and sanitized failures. This slice adds a reproducible staged-index
check, private-file exclusions and the [handling guide](../../development/secrets-poc.md).

## Desired state and requirements

- No real secrets in tracked POC configuration, examples, source or browser assets.
- Keep private local files out of Git and Docker build inputs; examples contain
  empty credential fields or fictional non-sensitive data only.
- Verify current credential transport and safe failures, and document bounded
  executable checks plus manual review. Apply controls with every vertical slice.
- Deliver only this local hygiene outcome; no production secret service is selected.

## Acceptance criteria

- [x] Review current delivered POC surfaces for secrets and preserve private-file exclusion.
- [x] Verify positive/negative index checks and existing sanitized configuration failures.
- [x] Record actual evidence, limitations and synchronized documentation without scope expansion.

## Domain and architecture constraints

Customer labels and source schemas remain scoped configuration/adapter data.
Retain [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are not permission to implement a decision. No new architectural pattern.

## Security and data considerations

Preserve organization/site permission checks in relevant operations and references.
Keep secrets, plans of facilities and production records outside the repository;
industrial integrations remain read-only and material changes require relevant
traceability. Retention, restoration and sensitive-data handling follow agreed
boundaries. The scanner cannot prove absence of every secret or inspect history;
manual review remains required. No production data or credentials are introduced.

## API and UI considerations

No API/UI contract changes. Existing startup/error tests verify safe failures without
configuration values or raw driver details. Browser configuration is public; future
operations must preserve input, authorization, scope and recovery boundaries and
show useful errors without sensitive data.

## Dependencies

[IOP-014](IOP-014-security-baseline.md) provides the completed local safety design;
[IOP-018](IOP-018-configuration-management.md) provides completed configuration
validation. Both are integrated on develop. Their current POC contracts suffice;
no login, external integration or runtime business-access dependency is introduced.
Dependencies identify required capabilities, not numeric implementation order.

## Non-goals

Adjacent stories, inferred acceptance of open decisions, customer names in the core,
full milestone delivery, hosted vaults, production rotation/recovery, shared hosting,
history rewriting, new CI/hooks or full-history security certification.

## Validation and documentation impact

The [execution plan](../completed/IOP-109-poc-secrets-plan.md) records commands,
positive/negative scenarios, actual results and limitations. Synchronize this item,
[backlog](../backlog.md), handling/testing/configuration guides and POC delivery.
Only change contracts, models or ADRs if this task changes their meaning.

## Open questions

No decision blocks this bounded POC slice. Future shared-use and integration secrets
require their own scoped requirements and validation; they are not completed here.
