# IOP-049 — Editable local mapping configuration

Status: Completed — editable local configuration and membership reconciliation. Owner supplied the five DAX membership lists on 2026-09-26
and requested editable names and area assignments. Continue the existing clean
`feature/IOP-049-source-mappings` branch created from develop, without merging.
Story: [IOP-049](../items/IOP-049-source-mappings.md).

## Scope and files

- Preserve the supplied membership and spelling in ignored
  `config/source-mappings.local.json`; use explicit example demo scope until host
  binding is delivered. No real labels enter tracked core, fixtures or seeds.
- Add fictional `config/source-mappings.example.json` and editing instructions in
  `apps/api/README.md`: sector display rename retains key, area reassignment changes
  its sector key, source-area rename must match the CSV, every edit gets a new
  mapping revision. Historical imports remain unchanged. No administration screen.
- Add focused rename/reassignment tests in `apps/api/test/source-mappings.spec.ts`.
  Existing SourceMappings accepts this JSON shape; no new architecture or loader.
- Synchronize the story, source contract, shared reference and POC delivery map.
  Keep IOP-049 open for durable import composition. Preserve the prior completed record.

## Validation

Validate all supplied memberships against the mapping stage, report per-sector and
unclassified counts without storing customer data in Git. Check duplicate normalized
keys and exact spelling; do not claim a Power BI runtime comparison. Run API build,
typecheck and tests with Node 24.21.0. Verify private-file exclusion, documentation
links, diff whitespace and staged secret hygiene; commit the tracked increment.

## Evidence and remaining work

- Preserved all 89 supplied area values and five sector labels in ignored local JSON.
  Per-sector counts in expression order: 11, 28, 12, 18, 20; no duplicate keys.
- Ran the actual CSV adapter and mapping stage on one synthetic measure row for
  each supplied area plus one unknown: 89 expected mappings, one unclassified,
  frequency 90 and accumulated seconds 180. Source spelling survives unchanged.
  This checks supplied membership under IOP rules, not a Power BI runtime comparison.
- Build/typecheck passed; API suite passed with Node 24.21.0: 10 suites, 247 tests,
  including sector rename, area reassignment and source-name change across revisions.
- `git check-ignore` confirms the private file is excluded. Documentation links,
  status consistency, diff whitespace and staged secret hygiene checked before commit.
- No generic runtime change was needed: existing SourceMappings consumes this JSON
  shape. File loading, durable receipt binding and runtime UI remain pending; story
  stays In progress. The tracked example is fictional. Local real configuration
  is intentionally absent from the commit and must be backed up separately.
