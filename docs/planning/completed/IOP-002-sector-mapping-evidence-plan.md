# IOP-002 — Sector mapping evidence

## Status and scope

Completed on `docs/IOP-002-reporting-context`. The owner supplied the Power BI
calculated-column expression and clarified selection of the corresponding date
at export. Correct the shared reporting reference and IOP-049/IOP-002 contexts.
This continues authorized evidence capture; no implementation or new decision.

## Steps and validation

1. Replace the earlier Python-mapping attribution with observed DAX classification.
2. Record area-to-sector grouping and fallback without copying customer mapping data.
3. Preserve unresolved sensor relationships and metric definitions.
4. Check Markdown links and whitespace, archive this plan and commit locally.

No code, database, merge or push. Task statuses remain unchanged.

## Evidence

Reviewed the supplied expression without executing Power BI. Corrected three
context documents. Local Markdown links and `git diff --check` passed; no runtime
tests apply. No customer mapping dataset or application code was added.
