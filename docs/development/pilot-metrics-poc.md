# POC pilot measurement and owner feedback

Prepared for [IOP-130](../planning/items/IOP-130-pilot-metrics.md).
Technical observations are recorded in the [IOP-147 execution evidence](../planning/completed/IOP-147-working-analytical-poc-plan.md).
The [delivered demonstration](running-poc.md) is runnable. The owner gave negative
feedback on the earlier experience on 2026-09-27; IOP-148–150 deliver the requested
corrections. The owner accepted the revised charts as Data Analysis v1 on
2026-09-27. Measured benefit and complete human task timings have not been
established; IOP-130 remains open for evidence consolidation.

Use the five [IOP-001 acceptance measures](../product/personas-and-pilot-workflow.md#accepted-acceptance-measures)
within the [local POC boundary](../product/scope-poc.md). One local operator may
perform import, investigation and presentation responsibilities; separate accounts,
additional participants and shared-use acceptance are not prerequisites.

## Evidence matrix

| Accepted measure | POC observation and assessment | Evidence to retain |
| --- | --- | --- |
| Workflow coverage | Operator completes import, failure/duplicate review, overview, filtered investigation, direct presentation and safe recreation. Assess each IOP-129 step separately; incomplete steps prevent a complete workflow result. | Link each demonstration step's outcome and actual run evidence. |
| Import integrity | Admitted/rejected/unknown counts and unclassified records remain explicit; invalid and duplicate attempts do not change admitted totals. Reset/reload reproduces the baseline. | Link IOP-129 failure/recreation results and the delivered source-to-fact reconciliation. |
| Analytical parity | Reported frequency and accumulated alarm seconds in both views equal independent expected values at the same selection and revision, with complete contributing-record identities. | Link the [IOP-132 matrix](reconciliation-poc.md) with expected/observed values and discrepancies. This establishes POC fixture reconciliation, not unexecuted legacy Python/Power BI parity. |
| Usability/value | Owner imports/reviews, filters by reporting date/sector/area/equipment/message, investigates contributors and presents directly from IOP. Record completed actions, assistance, obstacles and the owner's assessment. | Task observations and explicit owner feedback below; no invented satisfaction score or effort-reduction claim. |
| Isolation/traceability | Delivered operations reject missing/foreign scope or grants and preserve scoped input-to-result provenance under the accepted local context. | Link IOP-129 preflight denial/positive-control evidence, actual-role RLS checks and contributing RAW/line references. General Audit remains pending; local human login is delivered under ADR-0035/IOP-165. |

Expected totals and selections belong to the linked reconciliation matrix. They are
not observations. Missing imports are not zero-fault periods; unknown source windows
remain visible. Reported frequency is not row count and accumulated alarm duration
is not plant downtime. No new formula, dashboard, telemetry service or target is added.

## Measurement session

1. Confirm the demonstration preflight gates and open a runtime execution plan for
   IOP-130. Reuse the IOP-129 run and IOP-132 evidence where commit, configuration,
   dataset and selections agree; do not repeat an entire suite solely for this story.
2. Record session date, application commit, local machine/browser/runtime versions,
   scope/source, mapping revision and fixture hashes. Record actual bytes and data
   record counts, admitted dates, import IDs and analytical revision. Link the
   demonstration record for shared metadata instead of duplicating it.
3. Observe the owner performing the workflow. For each task record outcome
   (`passed`, `failed` or `blocked`), assistance, retries, visible limitations and
   evidence reference. A missing prerequisite is blocked, not a zero result.
4. Record elapsed observations in milliseconds or seconds with the measurement
   method and start/end boundaries. For import: submission to visible terminal
   outcome; for a read: applying a selection to stable results; for reset: delivered
   command start to successful completion. Record reload separately. For the overall
   workflow: first submission to completed presentation, noting pauses/assistance.
   Record every attempted sample, its outcome and cold/warm conditions. If no timing
   was captured, write `not measured`; do not infer a duration from expected data.
5. Capture the owner's answers after the real presentation and link any reported
   limitation to the affected task/selection. Keep reported opinion distinct from
   observed behavior. Record date and speaker responsibility; preserve quotations
   only when actually supplied. Exclude secrets and private operational data.

Timings are descriptive observations with dataset size and environment, not service
levels or formal performance certification. No minimum sample size, numeric value
threshold or comparison against the old workflow is accepted for this POC. Do not
claim speedup, savings, reduced downtime or operational improvement without a
separately authorized baseline and measurement.

## Owner feedback record

Use these prompts during the delivered session, without pre-filling answers:

- Could you complete import/error review and find the contributing records? Where
  did you need assistance or encounter an unclear state?
- Could you explain both measures, the applied filters and the coverage limits
  directly from the two views? What impeded the presentation?
- Is this local CSV-to-presentation result useful for the intended demonstration?
  Record the owner's assessment and concrete reasons, including unresolved concerns.

For each response record the prompt, actual answer, linked task/evidence, impact on
this POC and disposition: observed limitation, required correction or future request.
Feedback does not authorize adjacent implementation or expand scope automatically.
Missing feedback stays `not collected`; successful automated tests cannot replace it.

## Current result and closure

Reviewed on 2026-10-06: workflow coverage, import integrity, analytical parity and
isolation/traceability have actual automated PostgreSQL/API/browser evidence in
IOP-147, including recorded import sizes and observed submission timings. They are
technical observations on fictional data, not a human pilot assessment. Negative
owner feedback is recorded in IOP-130; subsequent delivery evidence is linked from
[delivery status](../planning/poc-delivery.md). Positive acceptance of the revised
workspace was recorded on 2026-09-27. End-to-end human task timing and the
consolidated five-measure record remain outstanding.

Close the selected IOP-130 POC slice only after each matrix row has actual evidence,
IOP-129's real journey passes, both measures reconcile and owner feedback is recorded.
Preserve failures, limitations and outstanding corrections; an unexplained numerical
mismatch or incomplete workflow prevents successful closure. An adverse owner
assessment must remain visible and unresolved POC needs must be addressed or
explicitly dispositioned by the owner before closure. The record does not certify
shared-use v1, formal performance, production readiness or deferred capabilities.
