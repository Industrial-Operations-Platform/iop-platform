# IOP-006 — Diseñar modelo RBAC

## Status

Proposed

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Diseñar modelo RBAC. Resultado esperado: Matriz Role → Permission → Scope documentada

## User / business value

El equipo necesita decisiones revisables antes de construir una plataforma reutilizable.

## Context

Ámbito: Product and cross-module architecture. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Matriz Role → Permission → Scope documentada

## Requirements

- Entregar únicamente el resultado descrito para IOP-006.
- Definir contratos y decisiones; mantener separadas identidad, permisos, scope y proveedores.

## Acceptance criteria

- [ ] Matriz Role → Permission → Scope documentada
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Definir contratos y decisiones; mantener separadas identidad, permisos, scope y proveedores.

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

Documentar implicaciones de persistencia y aislamiento sin crear esquemas.

## API considerations

Especificar contratos cuando corresponda; no crear endpoints.

## UI considerations

Documentar necesidades de los usuarios; no seleccionar ni construir UI por inferencia.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md), [IOP-005](IOP-005-tenancy-and-data-isolation.md)

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
