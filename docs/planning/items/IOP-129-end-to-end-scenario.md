# IOP-129 — End-to-end scenario

## Status

Proposed

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

End-to-end scenario. Resultado esperado: Workflow completo funciona

## User / business value

Usuarios y administradores necesitan una versión demostrable, operable y documentada.

## Context

Ámbito: Validation and release readiness. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Workflow completo funciona

## Requirements

- Entregar únicamente el resultado descrito para IOP-129.
- Verificar el alcance de v1 acordado, no exigir todas las ideas futuras del backlog.

## Acceptance criteria

- [ ] Workflow completo funciona
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Verificar el alcance de v1 acordado, no exigir todas las ideas futuras del backlog.

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

Reconciliar evidencia y probar recuperación con datos autorizados o sintéticos.

## API considerations

Validar contratos publicados y compatibilidad documentada; no introducir features durante cierre de release.

## UI considerations

Validar el workflow acordado y documentación por persona; registrar limitaciones conocidas.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-028](IOP-028-local-authentication.md), [IOP-030](IOP-030-membership-model.md), [IOP-040](IOP-040-asset-search.md), [IOP-048](IOP-048-data-reconciliation.md), [IOP-067](IOP-067-previous-shift-overview.md), [IOP-075](IOP-075-maintenance-history.md), [IOP-083](IOP-083-unmapped-assets.md), [IOP-088](IOP-088-asset-detail-page.md), [IOP-096](IOP-096-analytics-drilldown.md), [IOP-128](IOP-128-demo-reset.md)

Las dependencias indican contratos/capacidades requeridos, no orden numérico de
implementación. Refinarlas en el plan antes de tocar código.

## Non-goals

Implementar tareas vecinas, aceptar decisiones abiertas por inferencia o extender la entrega a todo el hito. No introducir nombres de cliente en el core.

## Validation

El plan debe fijar comandos y escenarios ejecutables para los criterios siguientes usando el tooling aceptado. Incluir camino esperado, errores y denegación de acceso relevante; registrar resultados reales, no tests ficticios.

## Documentation impact

Actualizar este item, su estado en [backlog](../backlog.md) y el plan de ejecución.
Actualizar contratos, modelo, guías o ADRs solo si cambia su contenido por esta tarea.

## Open questions

Confirmar el contrato aprobado, casos límite y evidencia exacta de este slice antes de activar implementación.
