# IOP-207 — Integration readiness execution

Status: Completed local readiness slice. Owner-authorized on 2026-10-14 under IOP-203's delegated
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

## Authorized documentation reconciliation — 2026-10-14

Root IOP-203 requests scoped synchronization of IOP-102/104–107 and this readiness
slice. Read their direct dependencies IOP-012/018/029/068/007/027/013 and translate
all Spanish prose encountered in these story files to English, preserving IDs,
links, scope and meaning. Record the exact translation-only files below; do not
scan or translate unrelated backlog stories. Registry configuration acceptance
can close independently of real provider transports, corporate login and observed
connection/freshness status. Root owns backlog/architecture and commits this
documentation increment after review.

## Translation-only edits

IOP-102/104/105/106/107 each contained a Spanish User/business value paragraph
and API paragraph. Both paragraphs are now English throughout each complete
story, preserving meaning, provider names, IDs and links. Separate authorized
status/coverage changes reconcile the delivered readiness; translations do not
expand acceptance. Direct dependencies IOP-012/018/029/068/007/027/013 were read
in full, already English and unchanged. No dependency translation-only files
were necessary and no unrelated backlog prose was scanned.

## Actual integration evidence — 2026-10-14

- API adapter/registry readiness suite: 6 checks passed; web readiness: 2 passed.
- Real PostgreSQL registry: 4 checks passed for current advanced profiles/grants,
  optimistic concurrent saves, immutable revisions and foreign-scope/RLS denial.
- Root integrates the registry controller/factory, current scoped permission
  bundles, narrow database grants, generated browser/API contracts and navigation.
- Actual local Playwright desktop and 390px screenshots were inspected: three
  disabled providers, no live connection claim, no page errors or horizontal
  overflow. The metadata form was reviewed and canceled without a save; its
  narrow layout also fits. Integration query returned 201 with the required
  same-origin request metadata. No provider network call, live corporate sign-in
  or real compatibility observation was performed.

The readiness slice is complete. Actual provider transports/schema/access,
identity binding and connection/freshness/failure observations remain explicitly
pending under IOP-104–107. Root owns the final backlog/architecture update and
validated local documentation commit; no publication is performed here.
