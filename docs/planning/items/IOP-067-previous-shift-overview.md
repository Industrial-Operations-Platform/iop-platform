# IOP-067 — Previous-shift view

## Status

Proposed

## Milestone

M7 — Shift Handover. Proposed delivery slice.

## Goal

Previous-shift view. Resultado esperado: Área muestra lo relevante del turno anterior

## User / business value

Equipos necesitan transferir contexto y problemas abiertos sin perder historial entre turnos.

## Context

Ámbito: Shift Handover. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Área muestra lo relevante del turno anterior

## Requirements

- Entregar únicamente el resultado descrito para IOP-067.
- Separar registro, entradas, cierre y temas abiertos; categorías locales son configuración.

## Acceptance criteria

- [ ] Área muestra lo relevante del turno anterior
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Separar registro, entradas, cierre y temas abiertos; categorías locales son configuración.

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

Conservar autoría, turno, referencias y cambios; el cierre no elimina issues pendientes.

## API considerations

Validar escritura/cierre según permisos y estado; referencias a activos usan contratos del módulo propietario.

## UI considerations

Distinguir borrador, abierto y cerrado; facilitar lectura del turno anterior sin mezclar scopes.

## Dependencies

[IOP-066](IOP-066-handover-closure.md), [IOP-008](IOP-008-time-and-timezone-model.md)

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
