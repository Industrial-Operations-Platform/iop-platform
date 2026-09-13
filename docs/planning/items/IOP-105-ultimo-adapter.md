# IOP-105 — Ultimo adapter contract

## Status

Proposed

## Milestone

M13 — External Integrations. Proposed delivery slice.

## Goal

Ultimo adapter contract. Resultado esperado: Modelo interno no depende de Ultimo

## User / business value

Administradores necesitan conectar fuentes sin acoplar el producto a un proveedor.

## Context

Ámbito: Integrations and Authentication adapters. Ver [módulos](../../architecture/modules.md) y
[workflow de planificación](../workflow.md). Este contexto inicial procede del
outline solicitado por el usuario; estar en backlog no autoriza implementación.

## Current state

Solo existe la baseline documental. Esta capacidad no está implementada ni su diseño detallado aceptado.

## Desired state

Modelo interno no depende de Ultimo

## Requirements

- Entregar únicamente el resultado descrito para IOP-105.
- WinCC y Ultimo son candidatos de adaptador, no entidades core; Entra se integra en Authentication.
- Ultimo es una integración candidata; el dominio de mantenimiento permanece genérico. Contrato y dobles de prueba pueden ser el alcance del piloto si queda documentado; no simular éxito productivo.

## Acceptance criteria

- [ ] Modelo interno no depende de Ultimo
- [ ] El plan documenta escenarios y decisiones necesarias sin ampliar el alcance.
- [ ] Existe evidencia de validación y documentación sincronizada.

## Domain considerations

WinCC y Ultimo son candidatos de adaptador, no entidades core; Entra se integra en Authentication.

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

Separar secretos, mapping, procedencia y scope; preservar flujos existentes durante cualquier migración.

## API considerations

Interfaces documentadas y autorizadas; fuentes industriales solo lectura. Contratos no prometen conectividad real.

## UI considerations

Mostrar salud y errores sin filtrar credenciales o datos de otro cliente.

## Dependencies

[IOP-012](IOP-012-source-integration-contract.md), [IOP-068](IOP-068-maintenance-record.md), [IOP-102](IOP-102-integration-registry.md)

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
