# IOP-070 — Priority model

## Status

Proposed

## Milestone

M8 — Maintenance Management. Proposed delivery slice.

## Goal

Priority model. Resultado esperado: Prioridad configurable

## User / business value

Técnicos y responsables necesitan seguir trabajos, prioridades y resultados sobre activos.

## Context

Ámbito: Maintenance Management. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Prioridad configurable

## Requirements

- Entregar únicamente el resultado descrito para IOP-070.
- Estados y prioridad requieren reglas explícitas; el board usa ubicaciones configurables, no niveles locales fijos.

## Acceptance criteria

- [ ] Prioridad configurable
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Estados y prioridad requieren reglas explícitas; el board usa ubicaciones configurables, no niveles locales fijos.

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

Conservar responsable, activo y transiciones con auditoría; no duplicar el registro canónico de activos.

## API considerations

Validar transiciones, pertenencia al scope y permisos de edición; referencias externas pasan por Integrations.

## UI considerations

Mostrar estado, prioridad, ubicación y responsable con filtros autorizados; no sustituir un CMMS completo.

## Dependencies

[IOP-068](IOP-068-maintenance-record.md)

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
