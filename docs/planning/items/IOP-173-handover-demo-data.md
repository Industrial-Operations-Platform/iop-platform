# IOP-173 — Handover demonstration data

Status: Completed locally. The owner requested representative placeholder entries across
users and departments, with historical dates, closed issues and different states.

Populate the local running installation with clearly marked `[DEMO]` entries using
its current users, configured departments/areas and imported equipment choices.
Cover all six categories, current-day meeting cards, older history, follow-up,
resolution, reopening, responsibility, overdue work and Start highlights.
Preserve existing records, credentials, grants and analytical data.

Use the existing handover application and PostgreSQL adapters under
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md). A local fixture clock
simulates historical activity; it must not alter production date rules or HTTP APIs.
Keep the seed explicit, bounded and repeatable without duplicating or overwriting
previous entries. No migration, automatic startup seed or new product behavior.

The request authorizes inserting these examples into the local running database.
Git publication remains a separate approval; IOP-172 remains on its review branch.

Delivered 60 examples across five departments and four users, with 125 immutable
revisions. The requested data is active in local Docker. Existing records and
analytical totals are unchanged; repeat execution is verified. See the
[execution evidence](../completed/IOP-173-handover-demo-data-plan.md) and
[operator guide](../../development/shift-handover.md#optional-local-demonstration-entries).
