# IOP-115 — Failure handling

## Status

Proposed

## Milestone

M14 — Security & Reliability. Proposed delivery slice.

## Goal

Failure handling. Resultado esperado: Jobs/imports recuperables

## User / business value

Clientes y operadores necesitan aislamiento verificable y recuperación reproducible.

## Context

Ámbito: Security and operational reliability. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Jobs/imports recuperables

## Requirements

- Entregar únicamente el resultado descrito para IOP-115.
- Aplicar controles desde cada vertical slice; este hito verifica y endurece, no posterga seguridad hasta el final.

## Acceptance criteria

- [ ] Jobs/imports recuperables
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Aplicar controles desde cada vertical slice; este hito verifica y endurece, no posterga seguridad hasta el final.

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

Retención, restauración y datos sensibles siguen decisiones acordadas; no copiar datos productivos al repositorio.

## API considerations

Probar límites de autorización, entrada, errores y recuperación relevantes a la tarea.

## UI considerations

Cuando haya UI, comprobar errores útiles sin datos sensibles y con contexto de scope correcto.

## Dependencies

[IOP-024](IOP-024-worker-infrastructure.md), [IOP-047](IOP-047-import-idempotency.md), [IOP-107](IOP-107-integration-health.md)

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
