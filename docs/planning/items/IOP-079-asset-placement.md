# IOP-079 — Asset placement

## Status

Proposed

## Milestone

M9 — Asset Locator. Proposed delivery slice.

## Goal

Asset placement. Resultado esperado: Asset puede posicionarse

## User / business value

Técnicos necesitan encontrar un activo validado en el plano correcto.

## Context

Ámbito: Asset Locator. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Asset puede posicionarse

## Requirements

- Entregar únicamente el resultado descrito para IOP-079.
- Mapa versionado y placement son diferentes del asset canónico y su jerarquía funcional.

## Acceptance criteria

- [ ] Asset puede posicionarse
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Mapa versionado y placement son diferentes del asset canónico y su jerarquía funcional.

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

Coordenadas en [0,1] ligadas a una versión de mapa; definir origen y orientación antes de implementar.

## API considerations

Resolver asset/alias por scope; el acceso a archivos de mapas también requiere autorización.

## UI considerations

Mostrar múltiples coincidencias y activos sin posición; no inventar coordenadas ni seleccionar un match ambiguo.

## Dependencies

[IOP-077](IOP-077-map-upload.md), [IOP-078](IOP-078-normalized-map-coordinates.md), [IOP-039](IOP-039-asset-survey.md)

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
