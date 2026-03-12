# Resultado Agente 2 - Arquitectura y Microservicios

## 1) Identificacion

- Agente: 2
- Rol: Arquitectura/Microservicios
- Fecha: 2026-03-12
- Version: v1.0

## 2) Resumen ejecutivo

- Hallazgo principal: existe base tecnica suficiente para MVP 90 dias, pero se requiere separar dominios para evitar monolito operacional.
- Propuesta: boundaries claros + contratos sync/async + pipeline por fases F0-F3.
- Confianza: alta.

## 3) Boundaries propuestos

- `svc-gateway`
- `svc-tool-exec`
- `svc-azure-ingest`
- `svc-analysis-orchestrator`
- `svc-evidence-store`

## 4) Contratos clave

- `POST /v1/tool/execute`
- `POST /v1/bug-analysis/requests`
- `GET /v1/bug-analysis/requests/{id}`
- Eventos: `bug.analysis.requested`, `azure.sync.finished`, `analysis.completed`.

## 5) Hallazgos clave

1. Slash/command y API session ya permiten introducir `/tool` sin reescribir todo (`C:\PROYECTOS\opencode\packages\opencode\src\server\routes\session.ts:803`).
2. Registry de tools y endpoint discovery existen (`C:\PROYECTOS\opencode\packages\opencode\src\server\routes\experimental.ts:18`).
3. MCP enterprise ya soporta OAuth y rutas dedicadas (`C:\PROYECTOS\opencode\packages\opencode\src\server\routes\mcp.ts:11`).

## 6) Riesgos y mitigaciones

- Riesgo: mezclar ingestion/orquestacion/analisis en el mismo deployable.
- Mitigacion: extraer por fases y versionar contratos desde F0.

## 7) Validacion no negociables

- Programming guide OpenCode: si.
- MCP empresa: si.
- `/tool <nombre_tool> <objetivo>`: si en plan de arquitectura.

## 8) Convergencia

- Point: `session.command` + evento `command.executed`.
- Symptom Link: sin policy y auditoria en este nodo, `/tool` no seria enterprise-safe.
- Confidence: 88/100.
