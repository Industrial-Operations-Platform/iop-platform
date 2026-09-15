# IOP-096 — Analytical drill-down

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Drill down from overview to contributing aggregate records.

## User / business value

Operación y responsables necesitan métricas explicables para priorizar problemas.

## Context

Ámbito: Operational Intelligence (OIP). Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Drill down from overview to contributing aggregate records.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Retain filters through sector, area, source equipment and message/detail navigation.
  Show scope, date/coverage and provenance. KPI-to-physical-asset navigation is
  deferred; aggregate rows are not individual occurrences.

## Acceptance criteria

- [ ] Drill down from overview to contributing aggregate records.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

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

[IOP-094](IOP-094-asset-analytics.md), [IOP-095](IOP-095-area-analytics.md), [IOP-097](IOP-097-analytics-filters.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

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

The requested path is overview → configured hall/sector → area → equipment → fault message or verified sensor identity. Retain scope, period and filters and expose contributing aggregate records. A collective fault is not a proven root cause. Physical maps, coordinates, plant surveying and 3D remain deferred.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains Proposed and no implementation or metric formula is accepted here.
