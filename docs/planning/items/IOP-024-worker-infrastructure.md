# IOP-024 — Worker infrastructure

## Status

Proposed

## Milestone

M2 — Development Platform Foundation. Proposed delivery slice.

## Goal

Worker infrastructure. Resultado esperado: Job de prueba ejecutable, retry e idempotencia comprobables

## User / business value

Los desarrolladores necesitan un entorno reproducible y validación ejecutable.

## Context

Ámbito: Development infrastructure and application hosts. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Job de prueba ejecutable, retry e idempotencia comprobables

## Requirements

- Entregar únicamente el resultado descrito para IOP-024.
- Aplicar únicamente el stack y los contratos aceptados; los hosts no son microservicios de negocio.

## Acceptance criteria

- [ ] Job de prueba ejecutable, retry e idempotencia comprobables
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Aplicar únicamente el stack y los contratos aceptados; los hosts no son microservicios de negocio.

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

PostgreSQL es la referencia; configuración de prueba y datos sintéticos separados.

## API considerations

Aplicar contratos de salud/error aceptados sin añadir funcionalidades de negocio.

## UI considerations

Solo lo necesario para verificar el host o entorno; no crear pantallas de negocio.

## Dependencies

[IOP-010](IOP-010-background-job-model.md), [IOP-016](IOP-016-backend-bootstrap.md), [IOP-018](IOP-018-configuration-management.md)

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
