# IOP-050 — Technician/team profiles

## Status

Proposed

## Milestone

M6 — Workforce & Shift Management. Proposed delivery slice.

## Goal

Technician/team profiles. Resultado esperado: Personas pueden asociarse a equipos

## User / business value

Técnicos y responsables necesitan saber quién trabaja dónde y cuándo.

## Context

Ámbito: Workforce and Shift Management. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Personas pueden asociarse a equipos

## Requirements

- Entregar únicamente el resultado descrito para IOP-050.
- Equipos, turnos y asignaciones son genéricos; Springer y nombres locales son etiquetas/configuración.

## Acceptance criteria

- [ ] Personas pueden asociarse a equipos
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Equipos, turnos y asignaciones son genéricos; Springer y nombres locales son etiquetas/configuración.

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

Separar perfiles laborales de usuarios autenticados; manejar zona horaria del site, medianoche y cambios de horario.

## API considerations

Validar permisos de planificación y acceso personal; definir conflictos sin asumir exclusividad universal.

## UI considerations

Mostrar intervalos y contexto de sitio claros; no implementar optimización automática ni nómina.

## Dependencies

[IOP-027](IOP-027-user-model.md), [IOP-030](IOP-030-membership-model.md)

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
