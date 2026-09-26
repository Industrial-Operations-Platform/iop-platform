# IOP-147 — Working analytical POC

Status: Completed. Owner authorized complete frontend/backend delivery on
2026-09-27, including local demo user switching, future third-party authentication
integration, necessary file changes and consolidation of redundant planning.
The owner explicitly waived intermediate development approval waits for this work.
Branch: `feature/IOP-147-working-analytical-poc`, from clean `develop` at `82f35cf`.
Item: [IOP-147](../items/IOP-147-working-analytical-poc.md).

## Scope and sequence

1. Consolidate the missing runtime work identified by IOP-146 into this requested
   vertical delivery. Preserve accepted isolation, exact metric/coverage semantics,
   source contracts and module ownership. Record the local user-switch adapter and
   its replacement boundary in ADR-0030 under the owner's explicit delegation.
2. Implement OIP publication/facts and queries: new migration and owning API module,
   receiver validation, immutable mappings, scoped references/revision and bounded
   pages. Extend provisioning verification for narrowly granted columns.
3. Implement explicit local host activation, configured demo-user sessions and
   current grants, same-origin mutations, receipt/parser/mapping/OIP composition,
   import history/review/recovery, RAW access and analytical endpoints. Keep health
   bootstrap usable independently. Update OpenAPI and generated browser types.
4. Connect the web experience: user selector, upload/errors/history, selected-file
   and historical analysis, shared filters, overview/detail/drill-down, provenance,
   coverage and accessible responsive states. Keep existing previews only as an
   explicit development example, not the default delivered demo.
5. Deliver reproducible local setup and offline exact-target reset with maintenance
   exclusion, quota reconciliation, rollback and reimport verification. Changes may
   include database CLI, Docker configuration, scripts, examples and package commands.
6. Add real-role database/HTTP and real-browser CSV journey checks, adversarial
   authorization/input/revision cases, independent fixture totals and reset checks.
   Run typecheck, npm test, database and browser suites; inspect the working UI.
7. Consolidate current POC delivery/status documentation and continuation plans,
   preserving permanent item contexts, ADRs and historical evidence. Close only
   criteria proved by this delivery; owner feedback cannot be invented. Commit
   small validated increments locally. No public deployment or force push.

## Expected files and acceptance evidence

API modules/host/tests/contracts, web UI/client/styles/tests, database migration,
provisioning/CLI/tests, local config/setup/reset tooling, package scripts and guides;
POC scope/delivery/readiness, affected item/backlog states and continuation plans.
Consulted English contexts require no translation; record any translation-only
changes if a consulted dependency is still Spanish.

Use two IOP-125 valid CSVs (9 facts, frequency 19, 97,775 seconds), invalid and
renamed duplicate cases, page-by-page reconciliation, persistent reload/history,
user switching with current revocation checks, cross-scope denial, origin refusal,
exact integer and budget limits, and guarded reset preserving unrelated data.
Record actual timings and limits, not a performance target or production-login claim.

## Implementation refinements

- One API-local composition story owns the coherent runtime delivery; existing
  design/preview contexts receive closure evidence rather than duplicate code plans.
- ADR-0030 records explicitly delegated local user switching and maintenance leases.
- OIP stores immutable publications and facts; one SQL statement supplies each
  query snapshot, full exact totals, bounded groups and cursor-bound records.
- Existing preview stays opt-in at `?preview=1`; the default frontend is the real
  workflow. Native demo commands use a dedicated labelled PostgreSQL container,
  ignored local configuration/credentials and an explicit installation identity.
- Runtime compiler tooling was restored in `/private/tmp/iop-147-runtime` because
  the older temporary npm installation was incomplete; project versions did not change.
- IOP-136 was consulted in Spanish. Translate its complete permanent context to
  English while refining it to the requested local user guide; record that translation
  separately from application behavior. Other consulted current contexts are English.

## Validation evidence — 2026-09-27

- `npm run test:poc` passed: type checking and builds; 9 secret-check unit tests;
  268 API tests in 12 suites; 22 web tests in 6 suites; 77 database configuration
  unit tests; 158 real-role/database tests in 10 suites (including those 77 unit
  cases and the 9 actual analytical journey scenarios); 18 Playwright preview/
  health cases. Do not add overlapping database counts as unique test cases.
- The dedicated analytical suite uses actual Nest HTTP, runtime/migrator roles,
  PostgreSQL 17.6 and Chromium. It verifies every expected source line, exact
  per-file/history/group/page totals, RAW equality, errors/duplicates, revocation,
  scope/origin denial, revisions/cursors, safe-integer overflow, historical mappings
  and distinct equipment/message/unclassified identities. Empty CSV is rejected;
  there is no admitted empty publication in this importer.
- The real browser uploads both files, analyzes file/history, drills and returns,
  uses filters by keyboard, changes user, reloads persistence and retries a failed
  response. Real views are checked at 1366×768, 768×1024, 1024×768 and 640×480.
  Exact-measure tables scroll inside their region on narrow screens. Basic text,
  control and focus contrast is checked; screenshots were inspected. No screen
  reader certification is claimed.
- Reset tests use an unrelated source as a byte-for-byte preservation control;
  reject wrong target identity, production mode, active/reconnecting hosts
  and quota drift; inject failure at each cleanup stage and a lost commit
  acknowledgement. Maintenance disconnect releases its lease. Explicit real
  reimport then reproduces the baseline; no automatic deletion/import replay.
- Operator commands were executed on a new dedicated, labelled local installation:
  `demo:setup`, `demo:fixtures`, `demo:start`, then stopped-host `demo:recreate` with
  its exact generated dataset identity. Both web and API listened on the documented
  loopback ports. Recreation removed exactly 2 attempts / 1,232 bytes, then verified
  9 records, frequency 19 and 97,775 seconds through the real importer/query path.
- Measured standalone HTTP samples on this local machine (Node 24.21, fresh
  disposable PostgreSQL; submission through terminal HTTP outcome): 756 bytes / 6
  records in 72 ms; 476 bytes / 3 records in 50 ms. These are one recorded pair of
  observations, not a throughput target, benchmark or owner task timing. Failed
  setup/test attempts are described below; no production performance claim.

## Resolved validation findings and boundaries

The initial database run exposed stale seven-migration/nine-table expectations;
these now explicitly account for nine migrations and twelve tables. The DDL rollback
fixture follows the new latest version, preserving the rollback test's purpose.
The full OpenAPI test now boots the same composed application as the real host.
A circular startup import was removed with a small host-address module. The launcher
uses an absolute Vite executable and strict browser port. A transient Docker daemon
failure was retried after the daemon became available; no check was skipped.

Final visual review improved narrow-table readability and exposes applied dimensions
and exclusions even when filters are collapsed. Aborted reads cannot apply late
results. Mapped sector text `Unclassified` is disambiguated from actual unclassified
membership. The affected build and real PostgreSQL/browser suite were rerun after
these final refinements; the complete suite result above preceded those small changes.

The implementation is a trusted native local demonstration, not third-party login
or shared-use security. The provider adapter is replaceable; production identity,
operations and broader platform modules remain deferred. File input follows the
existing UTF-16/filename/source contract, not arbitrary CSV dialect inference.
Owner usability/value feedback and human workflow timing remain uncollected under
IOP-130; technical completion does not invent that acceptance.

## Documentation disposition

Consolidated current delivery into one map and operator guide; retained the dated
IOP-146 readiness snapshot as historical evidence. Updated selected permanent item
criteria and backlog with actual IOP-147 evidence; archived the six resolved runtime
continuation plans without deleting their original branch/history. IOP-136 was fully
translated from Spanish, then explicitly refined to the selected POC user guide.
Architecture summaries and current testing guidance now describe delivered behavior.
Broader Deferred stories and unmerged historical review branches remain intact.

Final affected-path verification: rebuilt the API/web/database and reran all nine
analytical PostgreSQL/browser scenarios successfully after visual/query refinements.
The keyboard contrast check uses actual Tab/Shift+Tab navigation, rather than
assuming programmatic mouse-mode focus activates `:focus-visible`.

Documentation validation passed: 645 local Markdown link targets resolve, all 23
changed permanent item statuses match the backlog, and `git diff --check` is clean.
The setup rerun preserved the same installation marker and retained reference data.

The staged-index secret hygiene check passed; private `.local-demo/` credentials
and generated test/browser output remain ignored. A final Chromium smoke check on
the operator launcher confirmed frequency 19 and 97,775 seconds after setup rerun
and process restart. The local demo was left running on 127.0.0.1:5173 for review.
