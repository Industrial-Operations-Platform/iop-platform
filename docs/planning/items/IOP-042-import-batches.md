# IOP-042 — Import batch model

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M5 — Industrial Data Foundation. Proposed delivery slice.

## Goal

Record a bounded direct import and its outcome.

## User / business value

Operación necesita datos importados trazables y métricas reconciliables.

## Context

Ámbito: Integrations and Operational Intelligence. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Record a bounded direct import and its outcome.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Track original input, configured scope, reporting date, status and accepted/rejected
  counts. No worker/job dependency. Define atomic admission and failure/retry behavior
  with the importer: a failed attempt must not silently publish partial analytical facts
  or block a valid retry forever.

## Acceptance criteria

- [ ] Record a bounded direct import and its outcome.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

RAW → validación → normalización; el módulo receptor valida invariantes. No deducir un activo físico solo de un texto.

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

Preservar procedencia y grano; distinguir ocurrencias de agregados. Rechazos y correcciones deben ser visibles.

## API considerations

Usar contratos de ingesta; credenciales y nombres de columnas externos quedan en adaptadores/configuración.

## UI considerations

Exponer estados, errores y resultados de importación solo si lo pide esta tarea; no crear un dashboard completo.

## Dependencies

[IOP-041](IOP-041-raw-ingestion-model.md).

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
