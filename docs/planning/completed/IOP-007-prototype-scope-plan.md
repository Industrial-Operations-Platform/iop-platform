# IOP-007 — Prototype authentication scope revision

Source: [IOP-007](../items/IOP-007-authentication-model.md).

## Status and authorization

Completed — proposal revision only. The owner explicitly requests basic login for an independent working
prototype, preserving third-party integration structure. Corporate Azure/Entra
access is unavailable. This authorizes simplifying the proposal, not accepting
all previously proposed session details or implementing adjacent stories.
Branch: `docs/IOP-007-authentication-model`, based on integrated develop `520471b`.

## Scope and files

Revise ADR-0015 and the permanent IOP-007 item to distinguish prototype necessities
from future identity features. Keep the backlog In progress and accepted baseline
unchanged while session details remain Proposed. Archive this plan on completion.

## Steps

1. Record basic local login and provider independence as owner-confirmed direction.
2. Remove recovery-token workflows, multi-provider account linking and enterprise
   readiness requirements from prototype acceptance. Preserve password hashing,
   session validation, logout and existing scoped authorization.
3. Describe the small replaceable adapter contract and defer actual Entra setup.
4. Validate links, status consistency and whitespace; commit locally.

## Database, API and UI impact

Documentation only. No code, schema, routes, provider deployment or new UI selected.

## Validation and completion

- [x] Scope matches explicit owner clarification.
- [x] Local links/statuses and git diff --check pass.
- [x] Evidence recorded and plan archived; no runtime tests claimed.

## Evidence

Revised only ADR-0015 and the IOP-007 context, plus this plan. The owner-selected
local prototype direction is explicit; session details remain Proposed. Deferred
recovery-token/email flows, registration, MFA, multi-provider linking and actual
Entra setup. Kept basic password/session protection and accepted RBAC unchanged.
Local Markdown file links, item/backlog In progress status and git diff --check
passed. No application code, runtime tests, merge or push performed in this slice.
