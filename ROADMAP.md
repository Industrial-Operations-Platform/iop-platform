# IOP roadmap

## Current v1 boundary

The owner has confirmed CSV events → analysis → locate the asset as the entire
v1 workflow, with individual login and appropriate views. The milestone inventory
below describes the longer-term platform; workforce, handover, maintenance and
direct vendor connections are future scope, not v1 gates. See
[the current scope](docs/product/scope-v1.md) before selecting a planned slice.


IOP avanza mediante tareas identificadas y slices verticales planificados.
La baseline documental está completada; IOP-002 tiene una recomendación de backend
pendiente de aceptación. No existe implementación ni calendario comprometido.

## Sequence

1. M1: validar personas/workflow (IOP-001), stack (IOP-002), contratos API (IOP-003)
   y decisiones de scope, seguridad, datos y operación (IOP-004–014).
2. M2–M5: entorno y hosts reproducibles, core autorizado, activos e ingesta.
3. Construir slices que conecten login → site → asset → CSV event → historial →
   locator → analytics, según contratos y dependencias de cada item.
4. Ampliar workforce, handover y maintenance según valor del piloto (M6–M8), con
   locator, historial y OIP (M9–M11). M12 es extensión propuesta de mejoras.
5. Seleccionar integraciones (M13), verificar seguridad/fiabilidad (M14), UX (M15)
   y demo (M16), hasta los gates de validación y release (M17).

Los números no son un orden obligatorio. M14/M15 no retrasan controles básicos
hasta el final. No terminar todo el backend antes de integrar frontend y datos.
M12 y conectores específicos requieren inclusión explícita en el alcance de v1;
no son compromisos de entrega por aparecer en el índice.

## Navigation

- [Backlog index](docs/planning/backlog.md): qué tareas existen.
- [Permanent contexts](docs/planning/items/): alcance y aceptación por ID.
- [Milestones](docs/planning/milestones.md): evidencia de salida por agrupación.
- [Workflow](docs/planning/workflow.md): cómo activar y cerrar trabajo.
- [Active plans](docs/planning/active/) y [completed plans](docs/planning/completed/).
- [Proposed v1 scope](docs/product/scope-v1.md).

No iniciar tareas siguientes automáticamente por completar una tarea. Las fechas,
objetivos y release scope se acuerdan con evidencia durante la planificación.
