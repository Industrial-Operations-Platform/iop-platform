# Milestones and exit evidence

Current v1 is CSV preparation, analysis and presentation; see the
[release scope](../product/scope-v1.md). The groupings below describe the broader
platform. Asset surveys/locator, meeting and shift workflows are not v1 gates.
Evaluate only the selected v1 slices when planning release validation.


M0 (baseline) completed. M1 in progress: backend accepted (ADR-0006); frontend/tooling remain open.
M2–M17 Proposed. La migración de planificación IOP-139 es un follow-up de M0.
Los hitos organizan capacidades; no obligan a completar cada bloque antes del
siguiente. Seguridad y testing acompañan cada slice desde el inicio.

Ver [backlog](backlog.md), [workflow](workflow.md) y [equivalencias](legacy-backlog-map.md).

## M1 — Product & Architecture Definition

Tareas: IOP-001–IOP-014.

Salida: Personas, workflow and decisions needed for the next slice are documented and accepted; ADR-0006 is Accepted, while other design work remains open.

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
