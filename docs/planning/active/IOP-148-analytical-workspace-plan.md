# IOP-148 — Analytical workspace execution plan

Status: In progress. Branch: `feature/IOP-148-analytical-workspace`, from clean
`develop` at `7ff8210`. The owner explicitly authorized IOP-147 integration and
publication; develop and its story branch were fast-forwarded/pushed to origin.
[Item](../items/IOP-148-analytical-workspace.md).

## Scope and sequence

1. Inspect the actual reference CSVs and supplied hall rules. Preserve all seven
   fields, codes, accents and punctuation; verify semicolon/UTF-16 decoding and
   exact duration conversion. Use existing columns for equipment/location/error investigation; do not invent
   separate PLC/sensor identities.
2. Extend the accepted query boundary with an OIP-owned persisted reporting profile,
   revision-aware all-history reports, bounded grouping/filtering and daily/weekly/
   monthly aggregation. Original immutable facts remain intact. Record the explicit
   historical analytical overlay and profile authority in ADR-0031 under the owner's
   delegated development scope. No provider, physical inventory or new KPI targets.
3. Add source-scoped hall preset; editable normalization, aliases, classification,
   source field types/units review. Profile changes are explicit and persist.
   Use parameterized queries and current grants; preserve reset/role restrictions.
4. Replace the default generic overview/detail screen with the requested report
   workspace: only Data analysis at left, user at top, administrator import action,
   shared filters, real ECharts rankings/scatter/trends/heatmap and lower template tabs.
   Import inspection/history and original retrieval remain available.
5. Provide a separate persistent reference installation so existing demo imports are
   not erased or mixed with customer examples. Load the owner's three authorized
   reference CSVs through the real importer and leave the reviewed app runnable.
6. Verify independent full-data/source-field/time-bucket totals and normalization,
   profile concurrency/revisions, permissions, duplicate behavior, browser chart/filter/
   import/profile journeys, responsive data alternatives and restart persistence.
   Run relevant API, real-role database and browser checks; inspect screenshots.
7. Reconcile current scope, delivery guide, affected story status and recorded owner
   feedback. Commit verified increments locally. Do not call screenshot goals or
   inferred physical relationships established metrics.

## Files and traceability

OIP module/profile/report SQL, host DTO/routes/generated contracts; database migration,
provision/reset guards/tests; scoped preset and launcher; React workspace/charts/styles;
package manifest/lockfile; POC scope/delivery/operator evidence and affected items.
IOP-092 and IOP-093 were read in Spanish: translate their entire contexts to English,
retaining their broader scope/status while selecting only the requested reporting
slices here. No repository-wide translation. Earlier technical completion is not
acceptance of the owner's visual/analytical outcome.

## Owner clarification

The owner clarified that PLC/sensor refers to the existing source columns:
Bereich is location, Betriebsmittelkennzeichen is the equipment/sensor identifier,
Meldetext is the error, and Typ is currently constant. No additional physical
identity or assignment model is requested. Implement those source dimensions
and the provided sector classification; this clarification supersedes tentative
PLC/sensor assignment work above.

## Architecture and backup refinement — owner request

Before further implementation, apply hexagonal architecture to the backend and
frontend analytical flow (ADR-0032): framework-free domain, application use cases
and inward-owned ports; PostgreSQL, HTTP, React and ECharts are outer adapters.
Composition roots inject adapters. Add boundary checks and in-memory use-case tests.
Existing import/query adapters can be reused behind ports without changing their
transaction/authorization semantics. Do not describe remaining legacy modules as
already migrated.

Inspect the supplied PostgreSQL backup as data, without executing its SQL or
restoring it over an existing installation. Record a compact source-model comparison
in `docs/architecture/wincc-backup-reference.md`. Align persistent source columns,
reporting dates, exact duration, area/equipment identity and stored sector mapping
with that evidence. Do not import unrelated manual intervention data or invent
Power BI formulas absent from the archive. Keep the backup and extracted data out
of Git. Tests must cover all-row publication and exact aggregate conversion.

## Evidence recorded during implementation

- Backup inspected without restoration: source/fact counts, exact duration and
  catalog differences recorded in the linked database reference. No backup bytes
  or extracted rows were copied into the repository.
- Source-column meaning clarified by the owner; no separate PLC/sensor identity.
- Backend reporting domain/application now use injected profile/report ports;
  import lifecycle orchestration uses an injected gateway. PostgreSQL, NestJS and
  CSV/source integration remain outer adapters. The browser reporting feature uses
  independent selection models/use cases and HTTP/React/ECharts adapters.
- First actual-role reporting tests: three cases passed (all-row totals, profile
  concurrency/revision changes and literal filtering). Expanded tests add the real
  CSV oracle, runtime recreation and reader-only denials.
- Reference setup and loader ran successfully in the isolated installation; all
  three original CSVs reconcile to 1,446 rows, frequency 8,496, 1,629,521 seconds.
  The reference profile is persisted; existing synthetic data is untouched.
- First real-browser inspection rendered four SVG charts with matching totals and
  no JavaScript errors. Visual screenshots reviewed locally; complete regression
  and updated browser journeys remain under validation.
- Full test run exposed outdated migration-count expectations and a changed filter
  accessible label; both were corrected. No acceptance is inferred from that run.
- Administrator/reader separation extends the explicit seed with an analytics-only
  option. Current permissions control the import action; backend checks remain
  authoritative. IOP-130 now records actual negative owner feedback honestly.

The former default `DemoApp.tsx` and `demo.css` are now unreachable. Remove them
and update host READMEs so only the new report workspace owns the real UI. Keep the
explicit `?preview=1` fixture application and its historical evidence. Final browser
verification covers the reader-only UI as well as backend permission denials.
