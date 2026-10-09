# IOP-200 - Execution plan

Status: In progress
Authorization: owner request and database-mode clarification on 2026-10-09.
Branch: `docs/IOP-200-native-development-guide`, created from clean develop after
the approved IOP-199 integration/publication/activation.
Scope: [permanent item](../items/IOP-200-native-development-guide.md).

1. Inspect current source, accepted architecture, delivery evidence, launcher,
   credentials/configuration contracts, Vite proxy and single-host lease.
2. Prepare private native identity/environment files and a loopback-only Compose
   overlay. Stop container API/web, expose the same database and exercise TypeScript
   watch, Node restart, Vite, health/session context, proxy/origin behavior and read-only
   persistence checks. Preserve data and restore the standard running stack afterward.
3. Author a concise English guide and reproducible ReportLab builder. Explain each
   runbook command, current module/file/UI maps, change/debug paths, test/contract
   workflow, offline prerequisites and current project limitations.
4. Generate the PDF with the PDF skill, render every page, inspect layout and
   extract text to check commands, metadata, page count and absence of secrets.
5. Check Markdown links/paths and statuses, record actual evidence, close the item,
   move this plan to completed and commit locally. Ask before publishing this new
   guide branch into develop and origin.

Expected files: item/plan/backlog; `docs/development/native-development-guide.md`;
`docs/development/pdf/build_native_guide.py`; `output/pdf/iop-project-native-development-guide.pdf`.
Add a scoped .gitattributes rule for generated PDF binary handling, avoiding text
whitespace checks on the PDF format's required serializer output.
Private ignored `.local-platform/native/` files and temporary PDF verification
files may be created for validation, without adding private content to Git.
No API/frontend source edits or new architectural patterns are planned.
For watch verification only, a temporary comment may be appended to the API health
controller and then restored byte-for-byte; generated JavaScript may also be
rewritten. No product behavior or final source diff is introduced.
Dependency contexts read so far are English; no story translation is needed.

Validation: reproduce the documented native commands against the actual existing
PostgreSQL database, verify watch/proxy/origin behavior and retained-data counts,
restore healthy Docker services, render/inspect all PDF pages, check links and
perform `git diff --check` plus staged secret hygiene. Code tests remain the verified
IOP-199 baseline; this story changes documentation only.
