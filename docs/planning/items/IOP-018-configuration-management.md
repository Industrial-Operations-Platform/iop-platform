# IOP-018 — Local configuration and environments

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M2 — Development Platform Foundation. Proposed delivery slice.

## Goal

Validate configuration for the local application and tests.

## User / business value

Los desarrolladores necesitan un entorno reproducible y validación ejecutable.

## Context

Ámbito: Development infrastructure and application hosts. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Validate configuration for the local application and tests.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Provide documented example configuration without secrets, explicit
  organization/site/source targets and startup validation. Production deployment
  profiles are later work. POC configuration consumes only the local safety slice of
  IOP-014, not login/session design.

## Acceptance criteria

- [ ] Validate configuration for the local application and tests.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Aplicar únicamente el stack y los contratos aceptados; los hosts no son microservicios de negocio.

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

PostgreSQL es la referencia; configuración de prueba y datos sintéticos separados.

## API considerations

Aplicar contratos de salud/error aceptados sin añadir funcionalidades de negocio.

## UI considerations

Solo lo necesario para verificar el host o entorno; no crear pantallas de negocio.

## Dependencies

[IOP-002](IOP-002-technology-stack.md), [IOP-014](IOP-014-security-baseline.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementar tareas vecinas, aceptar decisiones abiertas por inferencia o extender la entrega a todo el hito. No introducir nombres de cliente en el core.

## Validation

El plan debe fijar comandos y escenarios ejecutables para los criterios siguientes usando el tooling aceptado. Incluir camino esperado, errores y denegación de acceso relevante; registrar resultados reales, no tests ficticios.

## Documentation impact

Actualizar este item, su estado en [backlog](../backlog.md) y el plan de ejecución.
Actualizar contratos, modelo, guías o ADRs solo si cambia su contenido por esta tarea.

## Open questions

Confirmar el contrato aprobado, casos límite y evidencia exacta de este slice antes de activar implementación.
