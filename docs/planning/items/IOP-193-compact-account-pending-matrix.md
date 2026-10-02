# IOP-193 — Compact account menu and pending department matrix

Status: Completed

Owner request of 2026-10-02, following approved IOP-192 publication:

- Show only initials in the account trigger. Display name and actual role inside
  a denser dropdown; preserve profile, language, authorized preview and logout.
- Keep language abbreviations (DE/EN). Render View as with its label left and
  a native role selector right, matching the language row without an extra button.
- Default Department matrix to ongoing work: configured carry-forward categories
  (Problems and Performance) remain while open/in progress. Other configured
  categories (Safety, Information, Success and People) appear only on their
  publication day in the site time zone; resolved entries are excluded.
- Keep historical categories and closed entries available through explicit history
  search. Ordinary department/column filtering narrows the operational matrix.
  Preserve notifications, journal/daily views, records, pagination and permissions.

Use existing catalog `carryForward`, query and identity contracts; no category names
belong in generic domain or storage policy. Publication of IOP-192 was authorized
and completed as merge `2004835`, with both approved refs pushed to origin.

References: [IOP-192](IOP-192-operational-cards-account.md),
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md),
[visual identity](../../design/visual-identity.md),
[execution evidence](../completed/IOP-193-compact-account-pending-matrix-plan.md).
