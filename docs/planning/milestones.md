# Milestones and exit evidence

## Immediate delivery milestone

The owner-approved [POC](../product/scope-poc.md) is complete when a local operator
can import a representative CSV, inspect quality/duplicate outcomes, obtain verified
frequency/duration in overview and detail, and present the result. The dedicated
demo is reproducible. Follow the [five delivery increments](poc-delivery.md).

Login, external connections, workers, full audit and the broader operational
platform are not POC exit gates. The local runtime context still requires its
own accepted mechanism; ADR-0018 is Proposed. No implementation exists yet.

## Longer-term capability groups

M0 is complete. IOP-001–006 and IOP-008 are completed design baselines on this
branch; other designs and all implementation remain as recorded in the
[backlog](backlog.md). The M1–M17 exits below describe future capability groups,
not a sequential checklist or extra POC requirements. Select only relevant slices;
security checks, testing and usable UI accompany each delivery.

## M1 — Product & Architecture Definition

Tareas: IOP-001–IOP-014.

Exit: Personas, workflow and decisions needed for the next slice are documented
and accepted. IOP-001–006 and IOP-008 are completed design baselines on this
branch; pending or deferred designs do not all gate the next analytical slice.

## M2 — Development Platform Foundation

Tareas: IOP-015–IOP-024.

Salida: Entorno reproducible, hosts, migraciones, tests y CI verificables; jobs y audit según contratos aceptados.

## M3 — Platform Core

Tareas: IOP-025–IOP-031.

Salida: Organization/site, identidad, memberships y RBAC funcionan con denegación cross-scope.

## M4 — Asset Domain

Tareas: IOP-032–IOP-040.

Salida: Assets, relaciones, aliases y validación permiten búsqueda sin niveles locales rígidos.

## M5 — Industrial Data Foundation

Tareas: IOP-041–IOP-049.

Salida: RAW, imports y normalización trazables; reimportación idempotente y totales reconciliados.

## M6 — Workforce & Shift Management

Tareas: IOP-050–IOP-059.

Salida: Equipos, turnos y asignaciones muestran quién trabaja dónde/cuándo con reglas temporales comprobadas.

## M7 — Shift Handover

Tareas: IOP-060–IOP-067.

Salida: Handover conserva autoría, issues abiertos y contexto de turno; cierre e historial verificables.

## M8 — Maintenance Management

Tareas: IOP-068–IOP-075.

Salida: Trabajo de mantenimiento vincula asset, estado, prioridad y responsable con historial.

## M9 — Asset Locator

Tareas: IOP-076–IOP-083.

Salida: Asset lookup abre la versión correcta del mapa; ambigüedades y activos sin posición son visibles.

## M10 — Asset History / Digital Asset Record

Tareas: IOP-084–IOP-088.

Salida: Detalle de activo une historial desde contratos propietarios, sin duplicar dominios ni inventar timestamps.

## M11 — OIP / Operational Intelligence

Tareas: IOP-089–IOP-097.

Salida: Métricas OIP tienen definiciones, filtros y trazabilidad; no confundir duración de alarmas con downtime.

## M12 — Improvement Tracking

Tareas: IOP-098–IOP-101.

Salida: Solo si entra en v1: acciones y objetivos tienen propietario definido, evidencia y comparación con límites explícitos.

## M13 — External Integrations

Tareas: IOP-102–IOP-107.

Salida: Contratos/adaptadores seleccionados verificables; distinguir integración real de dobles de prueba y diferir fuentes sin acceso.

## M14 — Security & Reliability

Tareas: IOP-108–IOP-115.

Salida: Autorización, secretos, validación, auditoría, backup/restore, rendimiento y recuperación tienen evidencia.

## M15 — UX & Operational Experience

Tareas: IOP-116–IOP-122.

Salida: Navegación y vistas seleccionadas son utilizables por rol, con estados y accesibilidad verificadas.

## M16 — Demo / Pilot Dataset

Tareas: IOP-123–IOP-128.

Salida: Dataset ficticio representativo y reset seguro/reproducible sin acceso a producción.

## M17 — v1 Validation & Release

Tareas: IOP-129–IOP-138.

Salida: Workflow, métricas, permisos, reconciliación y objetivos aprobados; guías, revisión y release trazables.
