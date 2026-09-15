# IOP-026 — Site model

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M3 — Platform Core. Proposed delivery slice.

## Goal

Persist one configured site with explicit organization ownership and time zone.

## User / business value

Administradores y usuarios necesitan acceso a organizaciones y sitios autorizados.

## Context

Ámbito: Platform Core, Authentication and Users/RBAC. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Persist one configured site with explicit organization ownership and time zone.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Use the organization seed slice and validate the site relationship and IANA zone. Site
  selectors and lifecycle administration are not required. Do not infer scope from
  source labels or treat missing site as all sites.

## Acceptance criteria

- [ ] Persist one configured site with explicit organization ownership and time zone.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

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

[IOP-025](IOP-025-organization-model.md), [IOP-008](IOP-008-time-and-timezone-model.md).

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
