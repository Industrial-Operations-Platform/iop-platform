# IOP-222 — Profile-first Start and compact Information

## Status and goal

Completed locally; code publication and deployment await approval. The owner's
2026-11-07 request is to keep Profile first on Start,
replace the oversized Information section with a presentation consistent with the
rest of the workspace, and correct Mike Gautschi's five November demo Information
entries to German.

## Scope and acceptance

- [x] Profile is the first content card on Start for operational and Administrator
  views, including while Information loads or reports an error.
- [x] Information uses shared panels, summary cards, counts and actions, with at most
  three previews and access to all active notices. Preserve detail navigation,
  display dates, site-wide scope, pagination and refresh behavior.
- [x] Inspect desktop and narrow layouts in light/dark appearance, verify German
  controls, accessible actions and no horizontal overflow.
- [x] Correct only the five retained November Information demo entries through the
  existing Handover correction use case, preserving identifiers, dates and history.
- [x] Run relevant frontend, design and architecture checks and commit locally.
  Remote code publication and deployment require separate owner approval under
  the repository workflow.

Ownership stays in the host composition and Shift Handover React presentation
adapters. Existing application ports own reads/writes; no API, permission or schema
change is required. Follow ADR-0007/0008/0032 and the visual identity.

## Evidence

[Execution and validation](../completed/IOP-222-start-information-plan.md).
