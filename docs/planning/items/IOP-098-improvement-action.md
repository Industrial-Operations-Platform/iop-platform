# IOP-098 — Improvement action

## Status and authorization

Completed — local implementation through [IOP-205](IOP-205-improvement-tracking.md).
The owner's explicit 2026-10-14 request authorizes Improvement Tracking delivery
and delegates development decisions under [IOP-203](IOP-203-platform-completion.md).
This supersedes the earlier proposed-only extension and undecided module ownership.
M12 is owned by the distinct Improvement Tracking module under Accepted
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md).

## Delivered behavior

Expected outcome: An action can be linked to an issue/asset.

Actions use explicit scoped registered-asset and Handover-issue references validated by owning-module ports. Linking never changes source records.

Administrator, Team Leader and Task Force receive scoped access; current profile
and grants are both required. Technician access is denied. The
[product contract](../../product/improvement-tracking.md) owns lifecycle, evidence
and comparison semantics; the [operation guide](../../development/improvement-tracking.md)
owns storage, routes and verification.

## Acceptance and evidence

- [x] An action can be linked to an issue/asset.
- [x] Ownership, authorized profiles and local module inclusion are explicit.
- [x] Scoped permissions, conflicts, revision/evidence atomicity and relevant
  analytical limitations are verified and documented.

The [IOP-205 execution record](../completed/IOP-205-improvement-tracking-plan.md)
contains actual validation. Root host activation and shared delivery documents are
coordinated under IOP-203; this does not claim owner product review or plant results.

## Dependencies and limits

[IOP-068](IOP-068-maintenance-record.md), [IOP-089](IOP-089-analytics-query-layer.md).

Accepted ADR-0014, ADR-0016 and ADR-0032 remain in force. Maintenance/Handover/OIP
retain their own records and semantics. Plant intervention dates, verified physical
identity, production/exposure data and causal attribution are not fabricated.
