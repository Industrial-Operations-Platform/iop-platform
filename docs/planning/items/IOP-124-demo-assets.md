# IOP-124 — Synthetic asset structure

## Status

Proposed

## Milestone

M16 — Demo / Pilot Dataset. Proposed delivery slice.

## Goal

Synthetic asset structure. Resultado esperado: Hall/area/assets realistas

## User / business value

El equipo necesita demostrar IOP sin infraestructura o información empresarial.

## Context

Ámbito: Synthetic demo and pilot fixtures. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Hall/area/assets realistas

## Requirements

- Entregar únicamente el resultado descrito para IOP-124.
- Usar organizaciones, nombres, activos y relaciones ficticios; las fixtures no definen niveles rígidos del dominio.

## Acceptance criteria

- [ ] Hall/area/assets realistas
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

Usar organizaciones, nombres, activos y relaciones ficticios; las fixtures no definen niveles rígidos del dominio.

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

Datos reproducibles, scope y procedencia explícitos; incluir casos inválidos/ambiguos útiles sin secretos.

## API considerations

Usar mecanismos de carga acordados; impedir que reset de demo pueda afectar producción.

## UI considerations

El usuario debe distinguir demo y datos reales; el alcance no incluye diseñar nuevas pantallas.

## Dependencies

[IOP-123](IOP-123-demo-organization.md), [IOP-039](IOP-039-asset-survey.md)

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
