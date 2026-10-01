# IOP-188 — User directory controls and current operational names

Status: In progress

## Authorized request and acceptance

Owner request of 2026-10-01, after accepting IOP-187:

- Reduce duplicate section/table titles. Department matrix has one clear title,
  centered date values and column widths suited to dates, narrative text, people
  and status metadata. Preserve the shared header alignment and long-prose rule.
- Users & profiles supports name/username search and sortable User, Profile and
  Status headings cycling ascending, descending and unsorted. Keep name/username
  close together. Edit through an explicit labelled icon beside Delete; the name
  itself no longer opens editing.
- Resolve current operational display names by stable user IDs so profile renames
  appear in Workforce plans/schedules/details and Handover current views. Preserve
  immutable revision snapshots, account IDs and scoped permissions. Resolve
  inactive/deleted referenced accounts without adding them to assignment choices;
  retain saved labels when a referenced profile is unavailable in the site.
- Validate rename propagation without rewriting stored records, directory search/
  sort/edit behavior, desktop/mobile layout and existing authorization boundaries.

References: [IOP-187](IOP-187-compact-workforce-tables.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md),
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md),
[visual identity](../../design/visual-identity.md).

[Execution plan](../active/IOP-188-user-directory-refinements-plan.md).
