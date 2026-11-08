# IOP-229 — Caption below the platform logo

Completed. Owner-requested follow-up on 2026-11-08 to place the localized
platform name below the logo. Continue the existing clean story branch
`feature/IOP-229-platform-logo`, originally created from `develop`; the initial
logo commit remains unmerged. [Permanent scope](../items/IOP-229-platform-logo.md).

## Changes and steps

1. Stack and center the supporting platform name beneath the logo in the shared
   workspace brand and public introduction (`components.css`, `landing.css`).
   Preserve the artwork, accessible Start/overview actions, existing translations
   and compact-screen caption visibility rules.
2. Adapt existing shell/landing browser assertions to verify vertical placement
   and horizontal centering. Synchronize visual identity and component/web docs.

Ownership remains shared design and host presentation under Accepted ADR-0032;
no architecture, application, API, schema or localization-content change is needed.
Read IOP-229 and dependency IOP-216 are already English.

## Validation and closure

| Check | Result |
| --- | --- |
| `npm run build --workspace @iop/web` | Design guards 4/4, TypeScript and production bundle passed |
| Existing shell-branding, platform-landing and appearance Playwright specs | 28 passed in 31.8s; exit 0 |
| Visual review | Desktop light/English and dark/German workspace, German introduction and 320px workspace inspected |
| Changed Markdown links and `git diff --check` | All local targets resolved; no whitespace errors |

Existing browser assertions now verify the 2px vertical gap, centered caption and
unchanged compact hiding rules, alongside Start navigation, header control alignment,
keyboard behavior, light/dark rendering and English/German switching. Validation
used fixture-only Vite preview and an ignored temporary Playwright config; the
server was stopped and config removed afterward. Screenshots remain under ignored
`apps/web/test-results/`. The build retains its existing large-chunk warning.
No API change, publication or deployment occurred.

Item/backlog are synchronized and this plan is retained under completed.
Publication still requires approval for merging the story into develop and
pushing both refs to origin.
