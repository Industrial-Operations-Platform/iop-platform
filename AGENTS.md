# Agent navigation

This is the single main IOP repository. It currently contains documentation and
placeholders only. Do not infer a framework or start features without a task.

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) before architectural changes.
2. Read relevant [ADRs](docs/architecture/adr/) before modifying architectural boundaries.
3. Check [active plans](docs/planning/active/) when implementing planned work;
   use the [backlog](docs/planning/backlog.md) and [roadmap](ROADMAP.md) for context.
4. Document new architectural patterns and decisions in the architecture docs/ADRs.
5. Keep customer-specific logic, names and source schemas outside the generic core;
   use scoped configuration/data and integration adapters.
6. Prefer small, reviewable changes; preserve unrelated work.
7. Keep documentation synchronized with architectural changes.
8. Run relevant tests before considering implementation complete. No test runner
   exists yet; for documentation changes check links, structure and consistency.

Use the [glossary](docs/product/glossary.md), [modules](docs/architecture/modules.md)
and [data model](docs/architecture/data-model.md) for domain context. Historical
OIP designs inform Operational Intelligence within IOP, not the whole product.
