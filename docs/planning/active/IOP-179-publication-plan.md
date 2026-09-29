# IOP-179 — Publication and Docker activation

Status: In progress. The owner explicitly approved merging
`fix/IOP-179-handover-entry-title-style` into `develop`, pushing both branches to
`origin` and updating local Docker on 2026-09-29.
This plan is authored on that story branch. [Scope](../items/IOP-179-handover-entry-title-style.md).

1. Verify clean refs and remote state. Reuse the validated
   [implementation evidence](../completed/IOP-179-handover-entry-title-style-plan.md)
   if integration introduces no code changes.
2. Commit this plan, merge into develop and publish both refs atomically.
3. Rebuild only the web service with Docker Compose, preserving API/database
   containers and volumes. Verify health and served assets against the local build.
4. Run the existing desktop/mobile handover journeys against the Docker-served
   frontend using intercepted fixtures; inspect the title hierarchy.
5. Archive the completed plan, synchronize the item and publish the evidence through
   the same approved story → develop path. No stage/master or branch deletion.
