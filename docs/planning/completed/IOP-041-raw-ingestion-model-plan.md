# IOP-041 — RAW ingestion model execution plan

Status: Completed (design only), 2026-09-26. Authorized by the owner's 2026-09-26 request, limited to the
[POC](../../product/scope-poc.md). Story branch:
`docs/IOP-041-raw-ingestion-model`, created from `develop` before substantive edits. The initial branch command was
blocked by the Git sandbox; the plan file was written before the successful
authorized retry. No implementation or other documentation changed on `develop`.
Permanent scope: [IOP-041](../items/IOP-041-raw-ingestion-model.md).

## Changes and steps

1. Review IOP-011/012/019/026 and Accepted ADR-0022, scope/isolation/temporal
   contracts and ADR-0007/0008. Their relevant slices are integrated on develop;
   no prerequisite branch integration is needed. ADR-0018 is Accepted but host
   activation remains unimplemented; it does not block this design.
2. Add `docs/architecture/raw-ingestion-poc.md`: logical RAW identity, mandatory
   immutable provenance, scoped record references, availability/outcome distinctions,
   rejected/incomplete input and implementation handoffs. Specialize existing
   contracts without selecting cross-module transaction or recovery mechanisms.
3. Translate the entire IOP-041 story to English, preserve its design-only boundary,
   and synchronize acceptance/status. Direct dependency stories are already English;
   no translation-only dependency edits are needed.
4. Link the model from `docs/architecture/data-model.md` and
   `docs/planning/poc-delivery.md`; update `docs/planning/backlog.md`.

No application, migration, endpoint, UI, provider registry or new architectural
pattern is included. New architectural choices, if discovered, require a Proposed
ADR and pause only dependent work; none is assumed accepted.

## Validation and evidence

Review field completeness against IOP-011/012 and walk through valid, malformed,
partial, duplicate, foreign-scope, integrity and interrupted-publication cases.
Check changed-document relative links, IDs/status consistency and `git diff --check`.
Documentation-only work does not execute API tests or claim runtime evidence.

Executed: `git diff --check` passed. A read-only relative-link/status check passed
for 206 file links across all six changed documents, the matching Completed
item/backlog/plan states and the absence of an active duplicate plan. Scenario
review results are recorded below; no parser/database tests were run.

## Closure

The RAW model covers the mandatory receipt fields from IOP-011/012, exact-byte
preservation and physical-line references. Reviewed all ten scenario rows against
the source/preservation contracts: valid/duplicate records, malformed/partial input,
date conflicts, foreign scope, quota/receipt failure, interrupted publication and
integrity failure retain the required outcomes. No new architectural pattern or
acceptance request is needed for this specialization of Accepted ADR-0022.

IOP-041 and backlog are Completed as design; the plan is in `completed/`.
Runtime persistence, recovery and host activation remain explicitly unimplemented.
No dependency story translation was required. Publication requires owner approval.
