# IOP-087 — Handover history

## Status

Proposed

## Milestone

M10 — Asset History / Digital Asset Record. Proposed delivery slice.

## Goal

Handover history. Resultado esperado: Notas relevantes visibles

## User / business value

Técnicos necesitan una hoja de vida del activo que una contexto operacional sin reconciliación manual.

## Context

Ámbito: Asset Management read views across owning modules. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Notas relevantes visibles

## Requirements

- Entregar únicamente el resultado descrito para IOP-087.
- La timeline es una proyección de lectura, no un nuevo módulo propietario de eventos, mantenimiento o handover.

## Acceptance criteria

- [ ] Notas relevantes visibles
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

[IOP-084](IOP-084-asset-timeline.md), [IOP-063](IOP-063-handover-asset-link.md)

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
