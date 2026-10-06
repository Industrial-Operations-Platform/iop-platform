# IOP roadmap

The current priority is the [local analytical POC](docs/product/scope-poc.md):
**CSV → preparation → persistent history → analysis → presentation**.

## Delivered

The three-container application imports daily CSVs, preserves originals, prepares
historical data and provides Executive Overview plus Halle, Bereich, Equipment,
Error and Daily/monthly analysis. Frontend and backend follow hexagonal boundaries;
shared presentation components preserve the established identity.
The [delivery status](docs/planning/poc-delivery.md) links implementation evidence.

## Remaining acceptance

[IOP-130](docs/planning/items/IOP-130-pilot-metrics.md) remains open for the owner's
assessment of usefulness. Review the current reports with representative data;
automated reconciliation does not establish that the experience meets this goal.
Any resulting change needs its own scope and execution plan.

## Later capabilities

- Third-party authentication and operating controls before shared use.
- Pareto as a function within Executive Overview, not a separate POC tab.
- External connections, full audit, workers, full asset hierarchy/maps,
  and improvement tracking when explicitly selected.

The [backlog](docs/planning/backlog.md) owns task statuses and capability groups;
the [v1 proposal](docs/product/scope-v1.md) describes the broader product direction.
These are not extra POC exit gates or commitments to delivery dates.
Follow the [workflow](docs/planning/workflow.md) when selecting work.

M6 Workforce is delivered by [IOP-184](docs/planning/items/IOP-184-m6-workforce.md);
corporate schedule connectivity remains deferred behind the manual import port.

M8 Maintenance Management and M10 Digital Asset Record are delivered on the
separate [IOP-194](docs/planning/items/IOP-194-maintenance-asset-history.md) review
branch. Owner review remains pending; this does not promote changes into develop,
stage or master. M9 Asset Locator remains deferred by explicit owner instruction.
