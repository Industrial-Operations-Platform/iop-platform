# Historical fixture-preview user guide — 2026-09-26

Archived preparation evidence, integrated by IOP-197. The instructions and pending
capabilities below describe the September 26 fictional preview. They are superseded
by the connected application delivered under IOP-147 and later operational stories.
Use the [current operator guide](../development/running-poc.md) for startup, login,
imports, analysis and supported operational workflows. IOP-136 is now Completed
for its selected local guide; the historical preview is not a current delivery gate.

For a technician or Team Leader presenting the local analytical preview.
Delivery status checked on 2026-09-26: navigation and fictional filter/drill-down
examples work; CSV upload, stored analytical results and demo dataset reset are
not connected. This guide does not establish completion of the
[CSV-to-presentation POC](scope-poc.md).

## Open the application

Ask the local operator to follow either the [native startup reference](../../apps/web/README.md)
or the [Docker startup reference](../../infra/docker/README.md).
They cover prerequisites, configuration and stopping the application. Open the
address for the chosen mode:

| Mode | Browser address |
| --- | --- |
| Native development | `http://127.0.0.1:5173` |
| Native built preview | `http://127.0.0.1:4173` |
| Docker | `http://127.0.0.1:8080` |

Use this on the local machine with one operator. There is no login workflow or
shared-user access in the POC. The health panel checks whether the API process
responds; success does not mean CSV imports or analysis are ready.

## Navigate the preview

- **Import CSV** (`/#import`) explains that files cannot yet be submitted.
- **Executive Overview** (`/#overview`) offers fictional totals and filters.
- **Analytical detail** (`/#detail`) offers the same selection and fictional
  contributing records. Open **Try shared filters with fictional data** in either
  analytical view to see them.

The normal analytical state says data is not connected. It remains separate from
the optional fictional example. Browser Back/Forward changes pages; use the
selection controls below to undo analytical narrowing. Page navigation preserves
draft/applied fictional filters; browser reload resets them.

## Try a reproducible analysis

1. Open **Executive Overview**, expand **Try shared filters with fictional data**
   and choose **Reset filters**. The default reporting date is June 28, 2026:
   **8 reported occurrences, 90,140 accumulated alarm seconds, 4 contributing records**.
2. Set **From** to June 26, 2026 and leave **Through** at June 28. Choose
   **Apply filters**. Expect **10 occurrences, 90,200 seconds, 5 records**.
   June 27 appears as a missing import; it is not a zero-fault day.
3. Under **Excluded messages**, select **Check · Warning · Inspection**, then
   **Apply filters**. Expect **6 occurrences, 200 seconds, 4 records**, including
   one record whose measures are both zero.
4. Choose **Inspect North**, **Inspect Area A**, **Inspect Pump · Area A**, then
   **Inspect Stopped · Alarm · Operations**. The first step opens Analytical detail.
   All four steps retain the date range and exclusion. North narrows the result to
   **6 occurrences, 200 seconds, 3 records**; subsequent steps retain those totals.
5. Read the contributing records below the group choices. Each shows its date,
   grouping, measures and fictional source/import/RAW/file/physical-line references.
   Repeated source lines remain separate. These example references do not provide
   an original file download.
6. Choose **Back to previous selection** to undo one narrowing, or
   **Return before Sectors: North** to restore the selection before that step.
   Return to Executive Overview using the main navigation to compare the same totals.

Date inputs are inclusive. Editing a draft does not change the displayed results
until **Apply filters**. Within one checkbox group, selected values are alternatives;
different groups must all match. An empty group adds no restriction. Excluded
messages are removed from the result. Including and excluding the same message,
or submitting invalid dates, shows an error and preserves the last applied results.

**Reset filters** restores the latest fictional date and clears dimensions,
exclusions and drill-down history. It does not delete an import or reset a database.
Applying filters also starts a new drill-down path.

## Interpret and present the result

| Display | Meaning and limit |
| --- | --- |
| Reported occurrences | Sum of source-reported frequency, not the number of source rows. |
| Accumulated alarm seconds | Sum of reported durations; overlapping alarms mean this is not plant downtime or availability. Durations may exceed a day. |
| Reporting date | Source reporting label, not an occurrence timestamp or proof of 24-hour coverage. |
| Missing imports | No imported coverage for those labels; never treat this as zero faults. |
| No matching records | Data exists for the range but does not match the applied filters. Review filters and exclusions. |
| Unclassified | Unresolved classification remains part of unrestricted totals. It is distinct from a configured sector literally named “Unclassified”. |
| Source equipment | A source label with area context, not a verified physical asset or sensor identity. |

For a Team Leader presentation, show the applied dates, exclusions and coverage
alongside both measures; then follow one group into its contributing records.
State that the current example is fictional. Do not present it as imported plant
evidence. These five UI rows are separate from the CSV reconciliation fixtures.
Exports and additional metrics are outside this POC; present directly in IOP.

## Keyboard use and recovery

Use Tab/Shift+Tab to move between links, disclosures, fields and buttons. Enter
activates links/buttons/disclosures; Space toggles checkboxes. **Skip to content**
bypasses navigation. Changing pages focuses the page heading. Drill-down return
focuses **Applied fixture selection**. Laptop and tablet layouts allow vertical
scrolling; these checks do not certify screen-reader behavior or future controls.

| Situation | Action |
| --- | --- |
| Browser cannot reach the page | Ask the operator to verify startup and use the address for the chosen mode. |
| API health unavailable | Start/restart the API using the startup guide, then choose **Check again**. This does not enable business data. |
| Unknown page fragment | Choose **Go to Import CSV** or a main navigation destination. |
| Invalid filter selection | Correct the draft or choose **Reset filters**; results remain from the previous valid selection until applied. |
| No matching fictional records | Review dimensions/exclusions, then apply or reset filters. |
| No imports in the fictional range | Select June 26 or June 28, 2026; changing dimensions cannot create date coverage. |
| Simulated loading or error | In **Preview UI states**, change **Simulated analytical state**. **Simulate retry** deliberately enters loading until another state is selected. |

**Preview UI states** is a separate simulation: **Reset state preview** returns to
not connected, without resetting fictional filters. None of these simulation
controls sends an import or analytical request.

## Pending real CSV demonstration

There is currently no working upload or scoped dataset-reset command to follow.
Do not substitute volume deletion or database teardown for a demo reset. The
[delivery map](../planning/poc-delivery.md) tracks the missing runtime capabilities.
When delivered, this guide must be extended and walked through with an operator:

1. Import an authorized or synthetic supported CSV and review validation failures
   and unresolved mappings without silently losing records.
2. Demonstrate rejection of an already imported reporting date in the same
   organization/site/source, even if renamed; no automatic replacement.
3. Compare independently reconciled overview/detail totals under matching filters
   and inspect actual contributing source records.
4. Use the delivered scoped reset procedure and recreate the known demo dataset.

Final verification belongs to [IOP-129](../planning/items/IOP-129-end-to-end-scenario.md)
and real-control accessibility to [IOP-122](../planning/items/IOP-122-accessibility.md).
The [IOP-136 story](../planning/items/IOP-136-user-guide.md) remains open until the
delivered journey can be documented and verified. No login, administration,
industrial connections or broader platform manual is required for this slice.
