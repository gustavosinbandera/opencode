# Plan de Compatibilidad Upstream + Capa de Reglas (4 Agentes)

Fecha: 2026-03-13
Owner: Gustavo + OpenCode
Estado general: En curso

## Objetivo

Mantener las personalizaciones enterprise (MCP/Azure/UX) sin perder la capacidad de recibir actualizaciones de OpenCode upstream, moviendo la logica sensible a una capa de reglas generica y de bajo conflicto.

## Paso previo obligatorio (antes de ejecutar el plan tecnico)

- [x] Acordar y congelar modelo de ramas de sincronizacion (upstream + integration + enterprise).
- [x] Definir perfil inicial de politicas en runtime (`strict`) para evitar ejecucion no intencional.
- [x] Aprobar checklist de validacion minima por cada sync (TUI, `/tool`, `/mcp-tools`, MCP call, Azure evidence).

## Equipo de 4 agentes (trabajando en conjunto)

### Agente 1 - Estrategia Upstream

Foco: branch model, cadencia de sync, mitigacion de drift.

- [x] Recomendacion de modelo de ramas y cadencia semanal.
- [x] Riesgos principales y mitigaciones documentadas.
- [x] Bajar a runbook operativo con comandos estandar por sync.

### Agente 2 - Touchpoints de codigo (bajo conflicto)

Foco: identificar puntos de integracion para policy engine sin tocar en exceso el core TUI.

- [x] Identificados puntos clave: `permission/next.ts`, `permission/capability.ts`, `session/prompt.ts`, `agent/agent.ts`, `config/config.ts`.
- [x] Identificados puntos a evitar por alta friccion: `prompt/index.tsx` (edicion invasiva), rutas TUI grandes.
- [x] Proponer parche minimo (hook unico) para enforcement universal.

### Agente 3 - Arquitectura Policy Engine

Foco: diseno de reglas genericas (intent gating, explain/confirm/block).

- [x] Definido esquema minimo de reglas (YAML/JSON), decision model y hooks de enforcement.
- [x] Definido rollout en 2 iteraciones (guardrails -> strictness controlada).
- [x] Definir contratos TS finales para implementacion (`PolicyContext`, `ProposedAction`, `PolicyDecision`).

### Agente 4 - Tracking y gobernanza

Foco: trazabilidad, checklist, DoD y control de avance.

- [x] Plantilla de tracking con milestones, blockers, DoD y log diario.
- [x] Checklist inicial consolidado con avances actuales.
- [x] Conectar tracking a ClickUp (epics + subtasks por agente).

Ticket base de ejecucion: ClickUp `86ag5mq85` (status: en curso).

## Avances hasta el momento (checklist)

### Checkpoints funcionales y tecnicos

- [x] `b2e4dd36c` restaura comportamiento estable de listado `/mcp-tools`.
- [x] `abd9063b4` ejecucion numerica por worker con salida temporal.
- [x] `ee7e57f83` cobertura de capacidades/permisos reforzada con tests.
- [x] `fd4e3c48c` endpoint base de evidencia Azure por bug.
- [x] `be6c8a6aa` parseo schema-aware de argumentos `/mcp-tools` (JSON, key=value, numerico + mode).

### Documentacion y auditoria

- [x] `c8da4670e` reportes de analisis multi-agente y evidencia visual.
- [x] Carpeta de auditoria creada: `documentacion-local/auditoria-docs-codigo/`.
- [x] Evidencia de comportamiento capturada: `imagenes/`.

## Plan de ejecucion (iteraciones)

## Iteracion 0 - Preparacion de sync compatible

- [x] Crear/validar remotos y ramas de sincronizacion (`upstream`, `integration/*`, `enterprise/*`).
- [x] Documentar protocolo de sync (semanal + seguridad urgente).
- [x] Definir top archivos de alto conflicto y estrategia por archivo.

## Iteracion 1 - Permisos basicos (sin capa policy compleja)

- [x] Mantener sistema de permisos basico sin engine de policy complejo
- [x] Limpiar referencias a modulo policy eliminado (`policy/engine.ts`)
- [x] Conectar enforcement en puntos de bajo conflicto (`permission/next.ts` + `session/prompt.ts`).
- [x] Mantener `/mcp-tools` funcional como baseline actual.
- [x] Agregar logs de decision de permisos (auditable).

## Iteracion 2 - Endurecimiento y compatibilidad upstream

- [x] Mover validaciones ad-hoc de TUI hacia permisos basicos.
- [x] Reducir cambios invasivos manteniendo compatibilidad.
- [x] Habilitar perfiles via configuracion de permisos.
- [x] Agregar pruebas de no regresion para flujo slash tools + MCP.

## Definicion de hecho (DoD)

- [x] Se puede hacer sync con upstream (2 commits traidos, divergencia reducida).
- [x] Sistema de permisos basico funciona sin engine de policy complejo.
- [x] `/tool` y `/mcp-tools` mantienen comportamiento esperado post-sync.
- [x] Azure evidence endpoint sigue operativo.
- [x] Documentacion y checklist de tracking actualizados.

## Riesgos y mitigaciones

- Riesgo: drift alto con upstream por cambios directos en TUI.
  - Mitigacion: centralizar enforcement en `permission/next.ts` + hooks compartidos.
- Riesgo: regresiones silenciosas en slash commands.
  - Mitigacion: smoke tests y suite de no regresion por iteracion.
- Riesgo: decisiones no trazables.
  - Mitigacion: logs de policy + checklist de auditoria en docs.

## Proxima accion recomendada

Integrar cambios a rama principal (`dev`) y verificar compatibilidad completa en runtime.
