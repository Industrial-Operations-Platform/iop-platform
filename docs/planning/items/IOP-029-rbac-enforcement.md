# IOP-029 — Authorization/RBAC

## Status

Proposed

## Milestone

M3 — Platform Core. Proposed delivery slice.

## Goal

Authorization/RBAC. Resultado esperado: Requests sin permiso fallan

## User / business value

Administradores y usuarios necesitan acceso a organizaciones y sitios autorizados.

## Context

Ámbito: Platform Core, Authentication and Users/RBAC. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Requests sin permiso fallan

## Requirements

- Entregar únicamente el resultado descrito para IOP-029.
- Organization representa el customer/tenant genérico; identidad, membership y permisos tienen responsabilidades distintas.

## Acceptance criteria

- [ ] Requests sin permiso fallan
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Organization representa el customer/tenant genérico; identidad, membership y permisos tienen responsabilidades distintas.

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

Conservar scope en entidades y relaciones; definir unicidad y lifecycle antes de migrar.

## API considerations

Operaciones públicas deben verificar identidad, permiso y scope; no exponer operaciones sin autorización durante el bootstrap.

## UI considerations

Mostrar solo scopes permitidos y errores de acceso claros; ocultar controles no sustituye autorización.

## Dependencies

[IOP-006](IOP-006-rbac-model.md), [IOP-027](IOP-027-user-model.md), [IOP-026](IOP-026-site-model.md)

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
