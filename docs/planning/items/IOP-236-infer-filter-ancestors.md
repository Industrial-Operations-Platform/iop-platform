# IOP-236 — Complete analytical filter ancestors

Status: Completed locally; publication approval pending. The owner requests that selecting a Bereich fills its Halle,
and selecting a lower analytical criterion completes its higher criteria.

## Acceptance

- [x] Complete missing earlier filter fields when all matching scoped facts have
  exactly one nonempty value for that field. Use the complete selected months,
  current filters, search, calendar and reporting exclusions, never a record page
  or a truncated suggestion list. Preserve ambiguous/missing ancestors as All.
- [x] Populate the draft controls before Apply, including equipment/message and
  later criteria. Preserve explicit parents, existing downward resets, month
  selection and explicit Apply. Never infer descendants or change applied totals
  while editing. Ignore stale responses and block Apply on pending/failed choices.
- [x] Verify complete-data inference, ambiguity, no matches, scope/exclusions,
  rapid changes, retries and desktop/narrow rendering. Keep source-file browsing
  and analytical metric semantics unchanged.

OIP owns full-data compatibility; the Analysis browser domain owns draft selection
transitions. Reuse [IOP-162](IOP-162-shared-month-filters.md),
[filter semantics](../../architecture/adr/ADR-0023-poc-analytics-filters.md) and
Accepted ADR-0032. This explicitly requested draft completion does not silently
change an applied analytical selection or imply physical asset identity.

[Execution evidence](../completed/IOP-236-infer-filter-ancestors-plan.md).
