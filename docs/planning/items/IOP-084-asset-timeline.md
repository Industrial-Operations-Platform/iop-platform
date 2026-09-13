# IOP-084 — Asset timeline model

## Status

Proposed

## Milestone

M10 — Asset History / Digital Asset Record. Documentation/design only.

## Goal

Asset timeline model. Resultado esperado: Eventos heterogéneos aparecen cronológicamente

## User / business value

Técnicos necesitan una hoja de vida del activo que una contexto operacional sin reconciliación manual.

## Context

Ámbito: Asset Management read views across owning modules. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Eventos heterogéneos aparecen cronológicamente

## Requirements

- Entregar únicamente el resultado descrito para IOP-084.
- La timeline es una proyección de lectura, no un nuevo módulo propietario de eventos, mantenimiento o handover.

## Acceptance criteria

- [ ] Eventos heterogéneos aparecen cronológicamente
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

La timeline es una proyección de lectura, no un nuevo módulo propietario de eventos, mantenimiento o handover.

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

Retener origen y semántica temporal de cada entrada; no inventar timestamps para agregados diarios.

## API considerations

Consumir contratos de lectura de módulos propietarios; no hacer escrituras ni joins privados entre módulos.

## UI considerations

Permitir navegar al registro de origen y mostrar periodo, tipo y ausencia de historial con claridad.

## Dependencies

[IOP-043](IOP-043-canonical-event-model.md), [IOP-068](IOP-068-maintenance-record.md), [IOP-060](IOP-060-handover-record.md), [IOP-008](IOP-008-time-and-timezone-model.md)

Las dependencias indican contratos/capacidades requeridos, no orden numérico de
implementación. Refinarlas en el plan antes de tocar código.

## Non-goals

Implementar aplicaciones, migraciones, endpoints o infraestructura. No introducir nombres de cliente en el core.

## Validation

Revisión de coherencia, enlaces, escenarios y decisiones; no inventar comandos ni escribir código para validar esta tarea de diseño.

## Documentation impact

Actualizar este item, su estado en [backlog](../backlog.md) y el plan de ejecución.
Actualizar contratos, modelo, guías o ADRs solo si cambia su contenido por esta tarea.

## Open questions

Resolver las decisiones concretas de diseño de esta tarea con opciones, recomendación y ADR cuando afecte arquitectura.
