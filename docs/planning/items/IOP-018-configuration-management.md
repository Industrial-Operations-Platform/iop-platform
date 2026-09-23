# IOP-018 — Local configuration and environments

## Status

Completed — local POC configuration slice, 2026-09-23. No production profiles,
persisted ownership checks or business execution mechanism are claimed.

## POC delivery applicability

Owner-approved refinement under [IOP-142](IOP-142-poc-delivery-scope.md) selects
[POC scope](../../product/scope-poc.md) and the [delivery map](../poc-delivery.md).
The owner requested implementation on 2026-09-22 and continuation on 2026-09-23.
Completion covers local application/test configuration only, not deferred platform
capabilities or full POC increment 1.

## Milestone and goal

M2 — Development Platform Foundation. Validate configuration for the local
application and tests, with reproducible documented startup and safe failures.

## Current and desired state

The API now validates a required bounded JSON file before creating the host.
One organization, one site with an explicit IANA zone and one source are declared;
site/source ownership references must agree. Unsupported fields and absent scope
fail closed. See the [configuration contract](../../development/local-configuration.md)
for exact fields, sources, precedence, limits, examples and startup commands.

Compose mounts private configuration read-only. Native API startup uses an explicit
path; tests supply synthetic configuration independently of local files. Frontend
configuration remains public and receives no server secrets or scope document.

## Requirements

- Deliver only the selected local POC configuration slice.
- Provide secret-free example configuration, explicit organization/site/source
  targets, bounded validation and safe startup failure.
- Consume IOP-014 local safety requirements without implementing login/session or
  accepting Proposed ADR-0018. Production deployment profiles remain later work.

## Acceptance criteria

- [x] Validate configuration for the local application and tests.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan without closing future scope.

## Architecture, security and data considerations

Reuse Accepted ADR-0001/0003/0004/0005/0006/0007/0008/0009/0012/0013/0016 in the
[ADR directory](../../architecture/adr/). No new architectural pattern is introduced.
Names/source schemas remain scoped data or adapter concerns. No credentials,
production records, schema, migration, seed or database connection is added.
Only exact supported fields are admitted, with a 16 KiB file bound and bounded IDs.
Errors name fixed fields/reasons without echoing values, paths or exception detail.

Ownership validation covers references within the configuration document. Future
consumers must additionally validate persisted references, permissions, RLS and
historical site-zone constraints. No source mapping fields are supported: reject
them until CSV adapter/mapping contracts define their bounded shape and references.
This story does not infer source reporting windows or apply mappings.

## API and UI considerations

The public health contract is unchanged and returns no configuration. Configuration
validation precedes listening; health still does not prove database/business readiness.
The frontend continues same-origin health access; browser tests provide explicit
synthetic API configuration. No business screens or operations are added.

## Dependencies

[IOP-002](IOP-002-technology-stack.md) and
[IOP-014](IOP-014-security-baseline.md) are completed design integrated on develop.
IOP-015/016/017 supplied the existing hosts. Relevant POC contracts suffice; no
login/session dependency is introduced. Runtime business access remains dependent
on acceptance of [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
or another accepted mechanism.

## Non-goals and deferred scope

Production/shared hosting, login, runtime authorization, general integration or
mapping registry, database bootstrap, reset and broader environment profiles.
Configuration transport selection is not local execution identity. Future importer
mapping admission and persisted ownership checks remain with their delivery stories;
no neighboring item is activated or completed.

## Validation and documentation impact

The [completed execution plan](../completed/IOP-018-configuration-management-plan.md)
records type checks, unit/integration/startup and browser tests, Compose model
validation, documentation checks and limitations. Startup instructions, the
configuration contract, item and backlog are synchronized. No open decision blocks
this completed local configuration slice.
