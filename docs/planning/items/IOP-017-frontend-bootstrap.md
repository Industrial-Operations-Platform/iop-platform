# IOP-017 — Bootstrap frontend

## Status

Completed — local POC health UI validated on 2026-09-22.

## Milestone

M2 — Development Platform Foundation.

## Goal

Run the accepted React/TypeScript/Vite web host and consume the public health API
within the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).

## User / business value

The maintainer can reproduce local UI startup and verify API connectivity before
adding CSV ingestion and analytical presentation.

## Context

The owner requested IOP-017 using [IOP-016](IOP-016-backend-bootstrap.md) as context.
See the [execution plan](../completed/IOP-017-frontend-bootstrap-plan.md),
[module boundaries](../../architecture/modules.md) and [workflow](../workflow.md).

## Current state

The React/Vite host consumes the existing API through a loopback proxy. Generated
browser types, Jest/RTL behavior checks and built-app Playwright journeys are
validated from a clean npm installation. Business functionality remains future work.

## Desired state

Reproducible web startup, verified same-origin API health connectivity and clear
loading, success and failure states with manual retry.

## Requirements

- Use accepted React, TypeScript, Vite, npm workspaces and Jest/RTL/Playwright.
- Consume public `/health` using relative routing and a local proxy.
- Derive browser types from the reviewed OpenAPI artifact and validate responses.
- Bound pending requests, abort on unmount, and show safe failure/retry behavior.
- Bind development and preview listeners to loopback; no browser secrets.
- Document commands and actual executable evidence without business-readiness claims.

## Acceptance criteria

- [x] The web application runs and consumes the health API.
- [x] The plan records dependencies, scenarios and bounded implementation choices.
- [x] Executable checks pass and documentation/evidence are synchronized.

## Domain considerations

Host bootstrap only; no business modules, customer labels or source schemas.

## Architecture constraints

Accepted ADR-0001–0011 in the [ADR directory](../../architecture/adr/) retain
host, isolation, workspace, frontend/testing and HTTP contract boundaries.
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) explicitly
assigns proxy implementation to frontend/configuration stories.
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md) requires
browser contracts derived from OpenAPI, without server-internal imports.
Proposed [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
remains unaccepted and is not implemented here.

## Security considerations

Public process liveness needs no principal or organization/site selector. No
business access, RLS change, login bypass, credentials or production data.
Network/HTTP/payload errors never render raw server diagnostics.

## Data considerations

No persistence, schema, migrations or seed data.

## API considerations

Consume existing `GET /health` with `200 {"status":"ok"}`; no API changes.
Generated types and runtime response validation preserve the consumer boundary.

## UI considerations

A single host status page with accessible status text, keyboard retry and readable
narrow layout. CSV, overview/detail navigation and charts remain later slices.

## Dependencies

- [IOP-002](IOP-002-technology-stack.md), [IOP-003](IOP-003-api-contract-strategy.md)
  and [IOP-016](IOP-016-backend-bootstrap.md) are Completed and present in develop.
- IOP-015/018/020 retain broader containers, configuration and testing; their full
  delivery is not a prerequisite for this minimum local host.
- ADR-0018 blocks dependent business access, not independent public-health UI.

## Non-goals

Adjacent stories, Docker, CI, hooks/lint platform, charts, CSV ingestion, analytics,
navigation across business views, authentication, permissions, persistence or
accepting Proposed decisions. This story does not complete POC increment 1.

## Validation

Clean npm installation, build/typecheck, existing API tests, Jest/RTL loading,
failure/retry/timeout/cleanup checks, OpenAPI consumer drift and Playwright against
the built UI plus actual API. Review package licenses, audit and documentation links.
See [web instructions](../../../apps/web/README.md) and the execution plan for results.

## Documentation impact

This item, backlog, execution plan, web README and current-host statements in the
root README, architecture baseline and agent navigation.

## Open questions

No architecture decision blocks this bounded host bootstrap.
