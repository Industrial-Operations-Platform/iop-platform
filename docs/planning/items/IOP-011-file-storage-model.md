# IOP-011 — Define CSV preservation for the POC

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define minimum preservation and retrieval of original CSV input.

## User / business value

El equipo necesita decisiones revisables antes de construir una plataforma reutilizable.

## Context

Ámbito: Product and cross-module architecture. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Define minimum preservation and retrieval of original CSV input.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- POC acceptance covers scoped RAW CSV provenance, bounded input size and safe local
  retrieval/storage behavior. Map storage, attachments and a generic object-storage
  abstraction remain future scope. Exact storage choice belongs to this slice, not an
  assumed new service.

## Acceptance criteria

- [ ] Define minimum preservation and retrieval of original CSV input.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Definir contratos y decisiones; mantener separadas identidad, permisos, scope y proveedores.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) y
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
ADRs Proposed son propuestas, no permisos para tomar la decisión.

## Security considerations

Verificar permiso y scope de customer/site en operaciones y referencias relevantes.
No incluir secretos, planos ni datos productivos en el repositorio. Mantener las
integraciones industriales read-only; registrar cambios materiales cuando aplique.

## Data considerations

Documentar implicaciones de persistencia y aislamiento sin crear esquemas.

## API considerations

Especificar contratos cuando corresponda; no crear endpoints.

## UI considerations

Documentar necesidades de los usuarios; no seleccionar ni construir UI por inferencia.

## Dependencies

[IOP-005](IOP-005-tenancy-and-data-isolation.md), [IOP-014](IOP-014-security-baseline.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementar aplicaciones, migraciones, endpoints o infraestructura. No introducir nombres de cliente en el core.

## Validation

Revisión de coherencia, enlaces, escenarios y decisiones; no inventar comandos ni escribir código para validar esta tarea de diseño.

## Documentation impact

Actualizar este item, su estado en [backlog](../backlog.md) y el plan de ejecución.
Actualizar contratos, modelo, guías o ADRs solo si cambia su contenido por esta tarea.

## Open questions

Resolver las decisiones concretas de diseño de esta tarea con opciones, recomendación y ADR cuando afecte arquitectura.
