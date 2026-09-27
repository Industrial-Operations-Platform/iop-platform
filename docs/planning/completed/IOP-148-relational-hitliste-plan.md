# IOP-148 — Relational Hitliste reference alignment

Status: Completed. Branch: `feature/IOP-148-analytical-workspace` (existing
unpublished story, originally based on develop). Owner clarification: 2026-09-27.

## Scope

Use the backup's normalized `analytics.fact_hitliste` and catalog relationships as
reference, not the prototype `public.hitliste`. Add a real `analytics.sektor` catalog
and mandatory `sektor_id` foreign key on the main analytical fact table. Retain
immutable original imports; preparation changes explicitly refresh the relational
analytical interpretation of all admitted history. No backup restoration or
unrelated manual-intervention tables. Preserve the current UI/identity and
hexagonal boundaries.

## Steps and files

1. Record the explicit owner decision and exact reference relationships in ADR-0033
   and the backup comparison; reopen the IOP-148 acceptance slice.
2. Add a forward migration: six scoped catalogs, typed fact table with scoped FKs,
   forced RLS and narrow runtime column grants. Update provisioning/schema checks
   and the offline reset dependency order.
3. Add a PostgreSQL Hitliste projection adapter; compose it with import publication
   and profile writes in the same authorized transaction. Serialize source refresh
   and profile updates. Backfill existing admitted facts during administrator startup;
   preserve raw/frozen facts. Read reports through relational joins and enforce
   projection/profile coverage consistency rather than silently dropping rows.
4. Verify exact counts, measures, catalog reuse, equipment/area consistency, sector
   FKs, reclassification, rollback, concurrent profile/import behavior, migration,
   RLS/foreign scope and reset. Re-run API and database/browser journeys.
5. Migrate the existing local reference installation without replacing data;
   reconcile source versus analytical rows and inspect the running UI. Update
   canonical docs, record evidence and commit locally. Publication remains pending.

## Evidence and outcome

- Re-read the backup schema as text with PostgreSQL `pg_restore --schema-only`.
  Verified the five catalog FKs and the old public source link. No backup SQL was
  executed; the temporary extract was removed. The selected model and its scoped
  adaptation are explicit in ADR-0033 and the canonical data-model diagram.
- Eleven forward migrations / 20 tables. Runtime has forced RLS, scoped FKs and
  narrow derived-column grants; reset includes all seven analytical relations.
- `npm test` passes: 9 secret-tool tests, 277 API tests, 26 frontend tests, 77
  database configuration tests, builds and generated contract check. Type checks pass.
  The initial strict TypeScript error in profile-row decoding was corrected before
  completion; no transport/schema DTO change was needed.
- All 168 database cases pass across the full run and targeted corrections: the
  seven foundation suites needed their fixed migration count changed from 10 to 11.
  The existing resize assertion now waits for chart reflow instead of sampling
  immediately after viewport change. The final reporting suite has 10 passing cases.
- Added actual-role evidence for catalog reuse, sector FK/null rejection, immutable
  measures, missing-context RLS, foreign scope, equipment/area consistency, complete
  backfill, stale/incomplete projection refusal, import/profile rollback, concurrent
  import/profile writes and CAS writers. Area/equipment aliases update the paired
  FKs without changing source data. Repeated codes in different areas stay distinct
  in storage and can still be grouped together analytically.
- Complete browser/reset suite passes: import and history, zero/filtered executive
  indicators, all templates, duplicate handling, identity colors, responsive layout,
  reset rollback at every new relation and preservation of foreign-source data.
- Upgraded only the existing `.local-analysis` installation using `analysis:setup`
  with its host stopped, then `analysis:start`. The registered dataset identity and
  originals survived. Reconciliation before/after: 1,446 rows, frequency 8,496,
  exact seconds 1,629,521; full join against immutable facts finds **zero mismatches**.
  `analytics.sektor` has six rows: five owner-defined halls plus unclassified.
- Actual migrated reference classification (rows / frequency): A T1 367 / 1,583;
  A T2 338 / 1,616; A T3 163 / 663; B Sh 198 / 1,624; B Sky 379 / 3,009;
  unclassified 1 / 1. Browser review confirms unchanged executive indicators,
  all six templates, drill-down, import review and Administrator-only selection.

Original backup history was not imported. The local reference app is running at
`http://127.0.0.1:5173`. Owner usefulness acceptance and branch publication remain
separate; this completes the requested relational implementation.
