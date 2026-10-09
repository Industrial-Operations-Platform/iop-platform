# IOP-201 — Docker icon delivery and publication

Completed on 2026-10-09. The owner approved merging `feature/IOP-201-platform-landing` into
`develop` and publishing both refs to `origin`, subject to verifying the selected
icon throughout the Docker application after `npm run local:up`.
[Scope](../items/IOP-201-platform-landing.md). Retain the story branch, created from
`develop` at `d469824`; current local icon commit is `93a6127`.

## Findings and changes

Live Docker HTTP already serves the selected SVG, and the existing Docker web
build passes. All branding consumers reference that same mutable URL, without an
explicit cache revalidation policy. Browser caching is the likely remaining
explanation for the owner's stale-icon observation; the source build context
requires no change.

1. Use `/iop-mark.svg?v=unified-record` in `index.html` and export the matching
   shared URL from `PlatformMark` for its image and host `IntroScene`.
   Revalidate the icon and entry HTML in `apps/web/nginx.conf`.
   Update existing icon URL assertions in `e2e/platform-landing.spec.ts`, the web
   README, Docker README and visual-identity asset description. No graphic, scene,
   interaction, credential or data change.
2. Inspect actual Compose state and HTTP delivery. Run the web build/design guard
   and scoped homepage/workspace regressions, rebuild the local Docker platform
   through `npm run local:up`, and compare served SVG bytes with the source.
   Verify homepage header/hub, authenticated shell and favicon resolution in an
   actual browser against Docker; use fixture identity only where needed for the
   shell, without reading credentials or changing user data.
3. Validate docs/statuses, whitespace and secret hygiene; commit the fix locally.
   Fetch `origin`, verify branch ancestry and clean state, merge the reviewed story
   into `develop`, and push both approved branches. Record runtime and publication
   evidence. Do not promote stage/master, reset data, rewrite history or delete
   branches.

Ownership is shared presentation and existing local packaging under Accepted
ADR-0034. No new architecture pattern or business/API boundary change. Root owns
implementation and runtime/publication; a delegate audits icon consumers and
packaging read-only. No Spanish dependency story was read.

## Validation and closure

- Native web build, TypeScript and design guard (3 checks) passed. Existing
  homepage/administrator browser regressions passed: 13 scenarios.
- `npm run local:up` passed, including the web image's mandatory design guard;
  database/API/web are healthy. Existing analytics seed was verified unchanged,
  with no seed dates imported.
- The same 13 existing scenarios passed against Docker at port 8080 using a
  temporary Playwright configuration without preview servers. Their identity and
  business responses are fixtures; the frontend/assets come from Docker.
- An additional browser check used the real unsigned Docker API context, without
  fixtures or credentials: header/hub/favicon URL, SVG bytes, access dialog and
  reload passed. Inspected `/tmp/iop-201-docker-public-home-1440.png` and the Docker
  desktop/mobile home and administrator captures.
- Live `/`, `/index.html`, unversioned and revisioned SVG return 200 with
  `Cache-Control: no-cache`; conditional SVG requests return 304 with the same
  policy. Served SVG bytes equal the selected source. Independent read-only
  cache/consumer review passed. `.dockerignore` and the selected SVG are unchanged.
- All 236 relative documentation links, pending-publication statuses and whitespace
  checks passed. Secret hygiene passed for 948 indexed files.

## Publication

The cache fix is `42667d1`. It was merged into `develop` as `5a68a4a` after verifying
that the resulting tree exactly matched the reviewed story. Atomic publication
of both refs to `origin` succeeded. `git ls-remote` verified the initial published
snapshot: story `42667d138638cc5008cee50e7cd125cc959c02c1`, develop
`5a68a4aa1a7ff4ca22881a02ac8abc6ac9f11cd5`.

This completed evidence record follows on the retained story branch and uses the
same owner-approved publication path. Runtime and publication criteria passed;
item/backlog are Completed. Prior evidence and review branches are preserved;
stage/master and deployment settings were not promoted.
