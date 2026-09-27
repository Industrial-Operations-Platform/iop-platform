# IOP-157 execution plan

Status: Completed
Branch: `feature/IOP-157-dependent-file-filters`, from develop at `1d11ac7`.
Context: [IOP-157](../items/IOP-157-dependent-file-filters.md).

1. Derive each SQL option set using preceding filter predicates over the complete
   file. Bind values and retain authorization, projection validation and limits.
2. Add framework-free frontend cascade transitions and a use case reusing the
   existing source-row port for candidate previews. React debounces draft reads,
   ignores obsolete results and gates Apply on successful nonempty matches.
3. Keep shared ValueFilter/form/disclosure presentation and explain dependent clears.
   Add domain/UI and database regressions, preserving manual entry beyond suggestions.
4. Run root/database checks and local Docker/browser verification; synchronize
   scope/operator/API docs, record evidence and commit the completed story.

Expected files: OIP source-row PostgreSQL adapter; web source-filter domain,
application workspace, SourceFiles/SourceFileFilters and tests; database regression;
API/operator/product docs and planning records. No migration, new endpoint,
dependency, identity tokens or new architectural pattern.

## Validation

Completed on 2026-09-27:

- `npm test`: scripts 18, API 287, web 50 and database configuration 77 tests passed;
  builds and generated browser contract checks passed.
- `npm run test:database`: 176 tests across 12 suites passed against PostgreSQL,
  including dependent options, invalid combinations, permissions and projection integrity.
- `npm run local:up`: all services healthy; seed verification retained 42,220 rows
  over 78 dates, with no new imports or changes to persisted source data.
- Read-only Playwright verification at 1440/1024/768/390 px: 82 initial areas,
  11 for Halle A T1 and 18 for Halle B Sky; equipment choices followed area.
  Ancestor changes cleared descendants, incompatible manual combinations disabled
  Apply, correction/clear/file switching worked, and Sunday browsing retained 26 rows.
  No page errors or horizontal viewport overflow.
- After the final pending-changes notice, all 50 web tests passed again and the
  rebuilt web container passed the same browser audit.
- Final whitespace, indexed Markdown links/statuses and secret checks passed.

IOP-156 was published at `1d11ac7` to origin/develop and its story branch under the
approval accompanying this request. IOP-157 is locally complete; publication requires
its own approval. Owner usefulness acceptance in IOP-130 remains open.
