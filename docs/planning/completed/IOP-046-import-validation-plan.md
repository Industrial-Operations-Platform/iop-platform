# IOP-046 — POC validation reporting

Status: Completed (independent validation-reporting slice), 2026-09-26. Authorized by the owner's 2026-09-26 request to work on
[IOP-046](../items/IOP-046-import-validation.md) within the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-046-import-validation`, created from clean `develop` before edits.

## Changes and steps

1. Reuse integrated IOP-045 preparation and IOP-012 source rules. Add bounded
   validation reporting in `apps/api/src/modules/integrations/csv-adapter.ts` and
   export it through `index.ts`. Share parsing with `prepareCsv`; preserve its
   throwing contract. Continue after identifiable value errors, stop at structural,
   resource or deadline failures, retain at most 100 value-free diagnostics, and
   never return partial records. Keep full counts independent of the diagnostic cap.
2. Adapt reports to IOP-042's existing `Inspection`/diagnostic vocabulary through
   an explicit pure handoff; no persistence/schema, HTTP or UI changes. Distinguish
   inspected counts from admission, unknown remainder and unavailable classification.
3. Add `apps/api/test/csv-validation.spec.ts` covering mixed input, complete versus
   interrupted counts, diagnostic bounds, exact-number failures, warnings, privacy,
   deadline/budget failures and unchanged preparation behavior.
4. Synchronize the item/backlog, API README, source contract and delivery map.
   No read story requires translation: IOP-045/012/042/043 are already English.

IOP-045 is integrated. IOP-042 storage and IOP-043 design provide handoff contracts;
production OIP receiver, IOP-049 classification and ADR-0018 host activation remain
undelivered. Do not activate these adjacent stories or claim end-to-end visibility.
The independent report slice needs no new architectural pattern/ADR; retain the
parent open for persisted import/UI composition. Existing authorization and RLS
remain mandatory at receipt, publication and review boundaries.

## Validation and evidence

Run API type checking and `npm test` (repository checks, API and web tests).
Verify two valid plus one invalid row gives complete counts 2/1/3 and no prepared
dataset; structural interruption gives unknown total; more than 100 invalid rows
preserve complete counts with truncated diagnostics; repeated/unmapped source text
remains valid without asset inference. Review changed Markdown links, IDs/statuses,
diff and secrets before a local commit. No database privileges or schema change.

### Executed evidence

- `npm run typecheck` and `npm test` passed using Node 24.21.0/npm 10.9.2 from
  `/private/tmp/iop-017-runtime/node_modules/.bin`: 220 API tests (including 89 CSV
  preparation/report tests), 15 web, 77 database configuration and 9 secrets tests.
  API/web/database builds and generated browser-contract comparison also passed.
- Initial execution used the shell's Node 20 and failed existing ESM/startup checks;
  loopback was also sandbox-restricted. Repeated with the repository's required
  runtime and approved local-network test execution; no application workaround.
- Verified diagnostic boundaries at 100/101 and 20,000 invalid rows, exact numeric
  overflow, interrupted/deadline counts, complete mixed rejection, warning retention,
  safe metadata and unchanged fail-fast preparation. A malformed-header fixture
  initially had the wrong column count; corrected it to test header-name rejection.
- `git diff --check`, changed-document relative links and item/backlog status checks
  passed. No schema, grants, API artifact or UI changes. Real-database/browser E2E
  reruns are not required for this pure parser change and are not claimed.
- The report uses `CsvInspection` (existing `Inspection` minus classification count)
  so the caller must explicitly provide scoped classification. This avoids claiming
  an unassessed mapping result. Terminal interruption reasons remain available even
  when retained diagnostics were already capped by earlier value errors.

## Closure

Moved this finished slice to completed and synchronized item/backlog, API guide,
source contract and delivery map. IOP-046 remains In progress until invalid records
are visible through the delivered importer. No adjacent story was activated.
Validated changes are committed locally; publication requires explicit approval.
