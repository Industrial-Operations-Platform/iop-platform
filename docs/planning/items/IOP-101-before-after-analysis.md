# IOP-101 — Before/after comparison

## Status

Proposed

## Milestone

M12 — Improvement Tracking. Proposed delivery slice.

## Goal

Before/after comparison. Resultado esperado: Impacto cuantificable

## User / business value

Responsables quieren evaluar acciones de mejora con evidencia antes/después.

## Context

Ámbito: Improvement tracking — proposed extension. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Impacto cuantificable

## Requirements

- Entregar únicamente el resultado descrito para IOP-101.
- La propiedad de acciones de mejora y su inclusión en v1 no están decididas; documentarlas antes de implementación.

## Acceptance criteria

- [ ] Impacto cuantificable
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

La propiedad de acciones de mejora y su inclusión en v1 no están decididas; documentarlas antes de implementación.

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

Mantener autoría, objetivos, evidencias y periodos comparables; no atribuir causalidad sin justificación.

## API considerations

Definir contratos con mantenimiento/OIP sin duplicar su dominio; no asumir un nuevo servicio.

## UI considerations

Distinguir objetivo, resultado observado e hipótesis; revisar inclusión en el piloto con IOP-001.

## Dependencies

[IOP-099](IOP-099-improvement-target.md), [IOP-100](IOP-100-improvement-evidence.md), [IOP-092](IOP-092-event-trends.md)

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

Confirmar el contrato aprobado, casos límite y evidencia exacta de este slice antes de activar implementación. Confirmar inclusión en v1 y módulo propietario antes de escribir código.
