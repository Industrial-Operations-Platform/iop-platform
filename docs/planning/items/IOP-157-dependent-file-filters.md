# IOP-157 — Dependent source-file filters

Status: Completed

The owner requests dynamic Files & source rows filters: choosing a sector must
limit Bereich choices to that sector and prevent incompatible combinations.

## Acceptance

- [x] Cascade file-column choices in displayed order: sector, area, equipment,
  message, type, message group, line, frequency and minutes. Each field uses all
  earlier nonempty criteria; its own/later selections do not hide alternatives.
- [x] Refresh choices while editing, before Apply. Changing a field clears subsequent
  criteria so hidden incompatible selections cannot remain. Explain this behavior.
- [x] Resolve choices and candidate counts against the whole scoped file, retaining
  the 200-suggestion bound and manual exact entry beyond that bound. Prevent Apply
  while validation is pending, failed or has no matches. Ignore stale responses.
- [x] Preserve shared components/styles, sorting/paging, Sunday browsing, original
  evidence, scope/permissions and complete projection validation.
- [x] Verify cascading, ancestor changes, rapid edits, file switching and unavailable
  previews, plus real PostgreSQL and local-browser behavior.

Dependency: [IOP-156](IOP-156-source-file-filters.md). Existing Accepted ADR-0031/0032/0033
boundaries apply. Plan: [execution](../completed/IOP-157-dependent-file-filters-plan.md).
