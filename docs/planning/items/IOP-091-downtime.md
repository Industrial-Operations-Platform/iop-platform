# IOP-091 — Downtime KPI

## Status

Proposed

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Downtime KPI. Resultado esperado: Duración reconciliada y downtime calculado solo cuando el grano y los intervalos fuente lo permiten; limitaciones visibles.

## User / business value

Operación y responsables necesitan métricas explicables para priorizar problemas.

## Context

Ámbito: Operational Intelligence (OIP). Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Duración reconciliada y downtime calculado solo cuando el grano y los intervalos fuente lo permiten; limitaciones visibles.

## Requirements

- Entregar únicamente el resultado descrito para IOP-091.
- OIP es un módulo de IOP; métricas desacopladas de UI y de esquemas de WinCC.
- Solo denominar downtime a intervalos de parada demostrables con reglas de solapamiento acordadas. Si la fuente solo tiene duración acumulada, presentar esa métrica y documentar que downtime no es calculable.

## Acceptance criteria

- [ ] Duración reconciliada y downtime calculado solo cuando el grano y los intervalos fuente lo permiten; limitaciones visibles.
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

OIP es un módulo de IOP; métricas desacopladas de UI y de esquemas de WinCC.

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

Definir grano, cobertura, unidades y periodos; duración acumulada de alarmas no equivale automáticamente a downtime.

## API considerations

Consultas con filtros de scope verificados y trazabilidad a registros contribuyentes.

## UI considerations

Mostrar definición y límites de la métrica; no presentar correlación como causa raíz.

## Dependencies

[IOP-089](IOP-089-analytics-query-layer.md)

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

## Owner-supplied CSV and reporting context

The current export supplies accumulated duration without individual event intervals. Separate accumulated alarm duration from elapsed plant downtime; overlapping alarms cannot be deduplicated into downtime from this excerpt alone. Verify duration units and parsing, and label charts honestly.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains Proposed and no implementation or metric formula is accepted here.
