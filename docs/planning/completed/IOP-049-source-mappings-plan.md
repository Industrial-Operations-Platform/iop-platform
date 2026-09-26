# IOP-049 — Scoped source mapping execution

Status: Completed — independent pure-classification increment. Authorized by the owner's 2026-09-26 request, limited to the
[POC](../../product/scope-poc.md). Story: [IOP-049](../items/IOP-049-source-mappings.md).
Branch: `feature/IOP-049-source-mappings`, created from clean `develop` before edits.

## Changes and steps

1. Reuse integrated IOP-012 source and IOP-043 aggregate contracts. Their story
   files are already English; translate the entire IOP-049 story while updating it.
2. Add pure scoped mapping configuration validation and CSV classification under
   `apps/api/src/modules/integrations/source-mappings.ts`, exporting its internal
   contract from `index.ts`. Use exact ASCII outer trim, reject duplicate area keys,
   invalid sector references and foreign/missing scope/revision. Copy/freeze the
   configuration and result; preserve records, measures and provenance.
3. Add `apps/api/test/source-mappings.spec.ts` with fictional configuration and the
   existing byte fixture. Check unclassified counts, comparison edge cases,
   revision snapshots, sector-key continuity and scope rejection. No real labels
   or source records enter Git.
4. Document the internal handoff in `apps/api/README.md`, the source contract and
   delivery map; synchronize item/backlog and evidence. Actual owner lists are not
   in the shared reference: request their local location and reconcile if available.

No schema, endpoint, UI, physical asset alias, registry or new architectural
mechanism. Host binding, durable mapping/receipt/OIP composition and runtime access
remain separate delivery. Stable sector keys identify the same reporting concept;
changed meanings require new keys, while display renames may retain keys. This
in-memory helper does not certify key continuity across independently loaded files.

## Validation and evidence

Run API typecheck/build and `npm test --workspace @iop/api`. Exercise all five
fictional sectors, unmapped records, exact totals, repeated tuples, invalid config,
same labels in independent scopes, immutable revisions and bounded configuration.
Check changed documentation links, status consistency, `git diff --check` and the
staged secret check before committing. No database security or DAX parity claim.

## Closure

Commit the validated independent increment. Keep the story open if actual list
reconciliation or runtime composition remains outstanding; record the concrete
limitation. Move this plan to completed when its executable slice is finished.
Publication requires the owner's explicit approval.

## Results — 2026-09-26

- Implemented bounded mapping validation and immutable configuration/result snapshots
  in Integrations; no schema, endpoint or customer data was added.
- The existing fictional byte fixture preserves 3 records (lines 2, 4, 5), frequency
  7 and 93,964 seconds. Two mapped repeated records contribute 4/180; the unclassified
  record contributes 3/93,784. Five-sector and exact-comparison scenarios also pass.
- API typecheck/build and `npm test --workspace @iop/api` passed: 10 suites,
  246 tests. Used Node 24.21.0 from `/private/tmp/iop-017-runtime/node_modules/.bin`.
  Initial runs picked up Node 20 and failed ESM startup; sandboxed loopback was also
  denied. Rerunning with the verified project runtime and permitted loopback passed.
- Translated IOP-049 fully; direct dependency stories were already English.
- Original customer membership lists are absent from the shared evidence. Asked for
  their local location and clarified what the lists mean. No real-list reconciliation
  or DAX parity is claimed; the story remains In progress for that evidence and
  durable import composition. In-memory semantic sector-key continuity still requires
  the configuration owner's review; no historical registry is introduced.
- Documentation links/status consistency, whitespace and staged secret checks are
  verified before commit. Publication remains subject to explicit owner approval.
