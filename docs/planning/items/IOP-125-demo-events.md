# IOP-125 — Synthetic analytical CSV fixtures

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M16 — Demo / Pilot Dataset. Proposed delivery slice.

## Goal

Provide representative CSV aggregates and independent expected totals.

## User / business value

El equipo necesita demostrar IOP sin infraestructura o información empresarial.

## Context

Ámbito: Synthetic demo and pilot fixtures. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Provide representative CSV aggregates and independent expected totals.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Fixtures cover valid, invalid, duplicate and unclassified examples with source
  equipment references, without asset surveys or external connections. Author fixtures
  before importer completion; validate them through IOP-103 when available. Preserve
  unknown windows and do not fabricate individual events.

## Acceptance criteria

- [ ] Provide representative CSV aggregates and independent expected totals.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Usar organizaciones, nombres, activos y relaciones ficticios; las fixtures no definen niveles rígidos del dominio.

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

Datos reproducibles, scope y procedencia explícitos; incluir casos inválidos/ambiguos útiles sin secretos.

## API considerations

Usar mecanismos de carga acordados; impedir que reset de demo pueda afectar producción.

## UI considerations

El usuario debe distinguir demo y datos reales; el alcance no incluye diseñar nuevas pantallas.

## Dependencies

[IOP-123](IOP-123-demo-organization.md), [IOP-012](IOP-012-source-integration-contract.md).

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
