# IOP-182 — Publication and Docker activation

Status: In progress. Owner explicitly approved story/develop publication and local
Docker update on 2026-09-30.
Branch: `feature/IOP-182-entry-detail-neutral-start`, created from `develop`.
Scope: [item](../items/IOP-182-entry-detail-neutral-start.md).

## Steps and validation

1. Check refs, fetch origin and commit this execution record on the story branch.
   Merge into develop and atomically push both branches to origin; verify hashes.
2. Rebuild/activate web with `docker compose -f compose.platform.yaml up -d --build
   --no-deps --wait web`. Preserve API/database identities and persistent data.
3. Verify container health, root/proxied health and served assets against the
   validated build. Run existing Start/handover browser journeys against Docker
   with intercepted API fixtures and inspect the served rendering.
4. Record actual evidence, synchronize item and implementation-plan status, archive
   this plan and commit/publish completion documentation through the same approved
   story/develop path. Preserve stage/master and the review branch.

Reuse [implementation evidence](../completed/IOP-182-entry-detail-neutral-start-plan.md)
when integration introduces no code changes. No dependency or image-tag upgrades,
setup, migrations, seed changes or volume deletion are needed for this UI update.
