# IOP-120 — Empty/error/loading states

## Status

Proposed

## Milestone

M15 — UX & Operational Experience. Proposed delivery slice.

## Goal

Empty/error/loading states. Resultado esperado: UX consistente

## User / business value

Técnicos, responsables y administradores necesitan flujos coherentes y accesibles.

## Context

Ámbito: Cross-module user experience. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

UX consistente

## Requirements

- Entregar únicamente el resultado descrito para IOP-120.
- Componer módulos existentes según rol; navegación visible no concede permisos de servidor.

## Acceptance criteria

- [ ] UX consistente
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Componer módulos existentes según rol; navegación visible no concede permisos de servidor.

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

Las vistas consumen contratos autorizados y no crean copias divergentes de entidades.

## API considerations

Reutilizar contratos de búsqueda/lectura; definir paginación y límites solo para el alcance seleccionado.

## UI considerations

Evaluar teclado, etiquetas, contraste y estados vacíos/error/carga en laptop y tablet; acordar objetivos verificables.

## Dependencies

[IOP-017](IOP-017-frontend-bootstrap.md), [IOP-022](IOP-022-api-error-model.md)

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
