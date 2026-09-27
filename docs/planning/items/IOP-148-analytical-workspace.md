# IOP-148 — Historical analysis workspace and import preparation

## Status

Completed

## Owner request — 2026-09-27

The owner says IOP-147's technical import/history flow does not satisfy the intended
POC. Deliver the supplied report experience: one Data analysis navigation entry,
header-only demo user selector, an administrator import/preparation workspace and
analyst templates below the report. Persist daily uploads, use the complete selected
history and show daily/monthly behavior, rankings, scatter and heatmap views.

Use the five explicitly provided hall membership lists as scoped configuration.
Support grouping/filtering by every source column, plus configured sector and
equipment identifiers. Preserve original characters and CSV bytes;
provide deliberate normalization/type interpretation and duration in minutes.
Physical PLC/sensor relationships cannot be guessed from opaque source codes.

## Acceptance

- [x] Administrator can upload daily CSV, review normalized types/classification and
      manage analytical preparation rules without losing original retained data.
- [x] All admitted historical data is queried server-side with scope and revision
      consistency; profile edits persist and explicitly apply to historical analysis.
- [x] Executive Overview, hall, area, equipment, message/type/group and daily/monthly templates
      provide real interactive charts and equivalent accessible data.
- [x] All seven source fields can be grouped/filtered, with exact frequency and
      duration conversion to minutes; special characters/commas remain intact.
- [x] Equipment investigation uses the existing source code, location and error
      columns, preserving their original associations.
- [x] Backend and frontend use hexagonal boundaries with tested dependency direction.
- [x] Persistent CSV storage and sector classification incorporate the supplied
      database reference without copying unrelated modules or rounding source measures.
- [x] Actual owner-provided files and independent expectations validate classification,
      normalization, historical graphs, persistence and the administrator/analyst journey.
- [x] Documentation distinguishes this requested outcome from the earlier technical
      POC, with owner feedback kept honest and local commits validated.

IOP-147 publication to develop/origin is explicitly authorized by this request.
This new implementation uses its own branch and does not infer publication approval
for unfinished changes. See the [plan](../completed/IOP-148-analytical-workspace-plan.md).

## Owner clarification

The owner clarified that PLC/sensor refers to the existing source columns:
Bereich is location, Betriebsmittelkennzeichen is the equipment/sensor identifier,
Meldetext is the error, and Typ is currently constant. No additional physical
identity or assignment model is requested. Implement those source dimensions
and the provided sector classification; this clarification supersedes tentative
PLC/sensor assignment work above.

The original implementation and the refinement below are validated. Owner acceptance of the
revised experience remains tracked separately in IOP-130.

## Owner refinement — 2026-09-27

Only Administrator is exposed by the current POC launcher, with import and analysis
access. Put useful prioritization KPIs only in Executive Overview; import row counts
belong to file review. Remove the Pareto tab and defer Pareto to a later Overview
feature. Preserve the current colors and styles as a documented shared identity.

- [x] Full-selection prioritization KPIs appear only in Executive Overview.
- [x] Import volumes stay in import review; Pareto is absent from live templates.
- [x] Shared visual tokens preserve the current identity across UI and charts.
- [x] The default POC offers Administrator only, with import and analysis access.

Execution: [refinement plan](../completed/IOP-148-executive-overview-plan.md).
