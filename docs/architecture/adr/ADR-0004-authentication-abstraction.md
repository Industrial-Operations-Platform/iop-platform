# ADR-0004: Authentication abstraction

## Status

Accepted

## Context

Customers may use different identity systems. Identity-provider details must not shape the operational domain, and authentication alone does not establish authorization.

## Decision

Place authentication behind a provider-independent boundary that maps verified external identities to a platform principal. Keep provider tokens, claims and SDK details in adapters. Users and RBAC owns membership, roles and scoped permission decisions; domain modules use platform identity and authorization contracts.

## Consequences

Identity providers can change without rewriting operational workflows. Identity mapping, provisioning, disabled-user behavior and permission enforcement require explicit design and tests. No provider, protocol, local-password store, session model or authentication framework is selected.

## Alternatives considered

Embedding a provider SDK across modules would couple business logic to one provider. Implementing a bespoke identity system now would add unsupported scope. Treating provider claims directly as domain permissions would mix authentication with authorization.
