# IOP-131 — Permission validation

## Status

Proposed

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

Permission validation. Resultado esperado: Matriz RBAC completa probada

## User / business value

Usuarios y administradores necesitan una versión demostrable, operable y documentada.

## Context

Ámbito: Validation and release readiness. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Matriz RBAC completa probada

## Requirements

- Entregar únicamente el resultado descrito para IOP-131.
- Verificar el alcance de v1 acordado, no exigir todas las ideas futuras del backlog.

## Acceptance criteria

- [ ] Matriz RBAC completa probada
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

[IOP-108](IOP-108-authorization-tests.md), [IOP-129](IOP-129-end-to-end-scenario.md)

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
