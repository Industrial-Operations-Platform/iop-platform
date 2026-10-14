# IOP-207 — Integration readiness execution

Status: In progress. Owner-authorized on 2026-10-14 under IOP-203's delegated
development request. Branch `feature/IOP-207-integration-readiness` from develop
`24b6269`. [Scope](../items/IOP-207-integration-readiness.md).

## Changes and steps

1. Add provider-independent read-only contracts and strict WinCC/Ultimo/Entra
   adapters with injected transports; absent transports fail explicitly.
2. Add bounded registry configuration, private credential references, current
   profile/grant checks, atomic revision storage and a role-aware readiness UI.
3. Add `20261014040000-integration-registry.sql`, domain/application/PostgreSQL
   files under Integrations, dedicated host controller/contracts/composition and
   browser feature. Parent IOP-203 composes hosts and shared permission migration.
4. Test adapter normalization, unconfigured behavior, optimistic conflicts,
   current role denial and UI readiness; document exactly missing real integration.

## Validation and evidence

Node 24.21.0; API/browser typecheck and focused Jest suites, meaningful persistence
checks during parent integration. No provider credentials/network calls are needed
for local contract tests. Real WinCC/Ultimo/Entra compatibility remains pending.

Verified standalone: API and browser workspace typecheck; API integration-readiness
suite 6/6; browser integration-readiness suite 2/2. Host composition, generated
bindings, actual PostgreSQL permissions/RLS and browser integration are verified
under the parent plan after the shared permission migration is assembled.

## Closure

Record actual evidence and commit this coherent story locally. Parent scope closes
only delivered local infrastructure; external integration criteria stay open.
