# ADR-0037 — Owner-delegated operational completion

## Status

Accepted for this development increment under the owner's explicit 2026-10-14
delegation in [IOP-203](../../planning/items/IOP-203-platform-completion.md).
The owner authorizes development decisions without further confirmation. This
does not accept unrelated historical Proposed ADRs or authorize publication.

## Decision

Reuse ADR-0032's modular monolith, inward dependencies, owner-defined read/write
ports and ADR-0026/0027's current scoped authorization/pinned transactions.

Improvement Tracking is a distinct module owning actions, goals, notes/results
and immutable comparison evidence. Maintenance retains technical work, Handover
retains issues and OIP owns analytical measures. Administrator, Team Leader and
Task Force receive explicit scoped Tracking access and formal-Handover management;
current profile and grants are both checked. Technician journal contribution stays
available under existing permissions. Provider identity does not confer roles.

Formal Handover retains actual Workforce-owned shift references and closed entry/
pending snapshots. Closure and receiving acknowledgement are attributed revisions;
closure does not resolve an issue. Previous shifts use UTC intervals and configured
location, not assumed calendar-day boundaries. Canonical asset links remain explicit
and retain original unverified source references alongside their revisions.

Asset Locator owns versioned scene/layout/placement records, not the asset registry.
Use reusable conveyor/sensor geometry behind a renderer adapter. Private source
diagrams carry image-local coordinates and provenance; provisional coordinates,
unknown elevations and unregistered global transforms stay explicit. The supplied
WinCC schematic snapshots cannot prove physical dimensions or current health.
Reported problems come only from currently authorized owning-module evidence.
Keep original images in ignored local storage and serve them through authorized
scoped application routes, never the public asset bundle.

External adapters expose owner-independent contracts, declared missing configuration
and bounded safe status. Local contract fixtures remain identified as fixtures.
No plant commands, implied real provider connectivity, fake credentials or automatic
installation of an identity policy are introduced.

## Explicit owner access refinement — IOP-211

The owner now restricts standalone Assets/Asset management and all Locator editing
to Administrator. Team Leader and Task Force retain read-only Locator navigation
and currently authorized reported-fault evidence through narrow owner-defined
identity ports; they gain no general registry/model mutation or directory endpoint.
Current-profile checks must deny stale writer grants. Maintenance/Technician
Locator expansion remains outside the request. Formal transfers remain the same
Handover-owned records, presented within its navigation rather than a separate
sidebar application. See [IOP-211](../../planning/items/IOP-211-locator-models-and-access.md).

## Verification

Plans identify owning files and actual behavior. Verify optimistic conflicts,
revision atomicity, forced RLS, current role/grant denial, coverage semantics,
private image delivery and real UI behavior. Retain original parents open whenever
plant input or full original acceptance remains unmet.
