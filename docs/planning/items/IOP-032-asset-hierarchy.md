# IOP-032 — Asset hierarchy model

## Status

Proposed

## Milestone

M4 — Asset Domain. Documentation/design only.

## Goal

Asset hierarchy model. Resultado esperado: Jerarquía configurable sin hardcodear niveles

## User / business value

Técnicos necesitan identificar y mantener activos fiables sin depender del vocabulario de un cliente.

## Context

Ámbito: Asset Management. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Jerarquía configurable sin hardcodear niveles

## Requirements

- Entregar únicamente el resultado descrito para IOP-032.
- Separar composición, localización física, relación de controlador e identificadores externos; no fijar niveles Hall/Area.

## Acceptance criteria

- [ ] Jerarquía configurable sin hardcodear niveles
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Separar composición, localización física, relación de controlador e identificadores externos; no fijar niveles Hall/Area.

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

Identidad canónica y referencias dentro del mismo scope; conservar evidencia de validación y tratar alias ambiguos.

## API considerations

Exponer contratos del módulo de activos, no tablas internas ni modelos de un proveedor.

## UI considerations

Mostrar validación, ambigüedad y ausencia de datos explícitamente; mapas pertenecen a Asset Locator.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md), [IOP-026](IOP-026-site-model.md)

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
