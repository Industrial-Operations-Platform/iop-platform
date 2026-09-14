# IOP-045 — CSV source adapter

## Status

Proposed

## Milestone

M5 — Industrial Data Foundation. Proposed delivery slice.

## Goal

CSV source adapter. Resultado esperado: Dataset de prueba importable

## User / business value

Operación necesita datos importados trazables y métricas reconciliables.

## Context

Ámbito: Integrations and Operational Intelligence. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Dataset de prueba importable

## Requirements

- Entregar únicamente el resultado descrito para IOP-045.
- RAW → validación → normalización; el módulo receptor valida invariantes. No deducir un activo físico solo de un texto.

## Acceptance criteria

- [ ] Dataset de prueba importable
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

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

[IOP-041](IOP-041-raw-ingestion-model.md), [IOP-042](IOP-042-import-batches.md), [IOP-043](IOP-043-canonical-event-model.md)

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

The observed source has seven semicolon-delimited columns. Preserve equipment designations as text and validate duration parsing, encoding and quoting against the actual exporter and existing Python script. The owner intends a TypeScript/Node.js port of the preparation behavior; compare normalized outputs with Python on identical input. The supplied loader reads UTF-16 and assigns every row a date parsed from `Hitliste-YYYYMMDD.csv`. The repository rejects dates already present. Reporting-window coverage, invalid-row handling and future scoped retry/correction semantics still require definition; the legacy date check alone does not establish concurrency-safe uniqueness.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains Proposed and no implementation or metric formula is accepted here.
