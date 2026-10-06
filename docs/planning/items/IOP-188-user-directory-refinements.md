# IOP-188 — User directory controls and current operational names

Status: Completed

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

[Execution plan](../completed/IOP-188-user-directory-refinements-plan.md).


## Outcome

Users can search by name/username, cycle prioritized heading sorts, and edit via
an explicit pencil action. Account labels sit on adjacent lines. Department matrix
uses one collection title, centered dates and compact metadata columns; standalone
table captions use section typography. Workforce and current Handover names resolve
by scoped account ID, including retained inactive/deleted references, while revision
snapshots remain unchanged. API, frontend, PostgreSQL and browser validation are
recorded in the execution plan. On 2026-10-02 the owner-approved IOP-190 publication
integrated this story into develop and published its commits to origin. The separate
IOP-188 review branch is retained; Docker activation remains pending.
See [publication evidence](../completed/IOP-190-publication-plan.md).

## Current delivery — 2026-10-06

Earlier activation/publication notes above describe the original increment. This
implementation is present in the current develop baseline; the later
[IOP-194 validation](../completed/IOP-194-equipment-catalog-refinement-plan.md) and
[publication](../completed/IOP-194-publication-integration-plan.md) record the
integrated local application and preserved data. No new activation or publication
is performed by the IOP-195 documentation audit.
