# IOP-178 — Publication and Docker activation

Status: In progress. The owner explicitly approved merging
`fix/IOP-178-handover-cards-navigation` into `develop`, pushing both branches to
`origin` and updating local Docker on 2026-09-29.
This plan is authored on that story branch. [Scope](../items/IOP-178-handover-cards-navigation.md).

1. Verify clean refs and fetch origin. Reuse the validated
   [implementation evidence](../completed/IOP-178-handover-cards-navigation-plan.md)
   if integration introduces no code changes.
2. Commit this plan, merge into develop and publish both approved refs atomically.
3. Rebuild only the frontend with `docker compose -f compose.platform.yaml up -d
   --build --no-deps --wait web`. Preserve API/database containers and volumes.
4. Verify health and served assets, then run the existing desktop/mobile handover
   browser journey against Docker with intercepted API fixtures and no live-data writes.
5. Record evidence, archive the plan and publish completion documentation through
   the same approved story → develop path. No stage/master or branch deletion.
