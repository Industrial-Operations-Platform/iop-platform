# IOP-002 — Elegir backend, frontend y tooling

## Status

In progress — backend recommendation awaiting acceptance

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Elegir backend, frontend y tooling. Resultado esperado: ADRs aprobados + comandos de dev/test definidos

## User / business value

El equipo necesita decisiones revisables antes de construir una plataforma reutilizable.

## Context

Ámbito: Product and cross-module architecture. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Existe una evaluación de backend y ADR-0006 Proposed; frontend y tooling siguen abiertos.

## Desired state

ADRs aprobados + comandos de dev/test definidos

## Requirements

- Entregar únicamente el resultado descrito para IOP-002.
- Definir contratos y decisiones; mantener separadas identidad, permisos, scope y proveedores.
- Preservar ADR-0006 como Proposed hasta aceptación explícita. Evaluar frontend y tooling por separado; no inferir elección por la recomendación de NestJS.

## Acceptance criteria

- [ ] ADRs aprobados + comandos de dev/test definidos
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

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md)

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

## Existing evidence

[Backend comparison](IOP-002-backend-evaluation.md) and
[active decision plan](../active/IOP-002-technology-stack-plan.md).
Backend evaluation complete; acceptance and the rest of the stack remain open.
