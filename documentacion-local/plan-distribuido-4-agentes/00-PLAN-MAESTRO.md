# Plan Distribuido En 4 Agentes

## Objetivo

Definir un plan de trabajo distribuido, critico y mantenible para analizar OpenCode con foco en:

- flujo desde prompt del usuario hasta llamada al LLM,
- preprocesado del prompt,
- tool-calling nativo,
- integracion empresarial (bugs, Azure, branches, evidencia tecnica).

Este documento solo define el plan. No incluye implementacion de codigo.

## Estructura del equipo

- Agente 1: Calling Tools Architect
- Agente 2: Arquitectura y Microservicios
- Agente 3: IA Orchestrator y Calidad de Hipotesis
- Agente 4: Azure Evidence Specialist
- Agente 5: MCP Tools DX and Help Quality

Cada agente tiene instrucciones detalladas en este folder.

## Principios operativos

1. Evidence-first: no conclusiones sin evidencia verificable.
2. Trazabilidad: toda afirmacion debe referenciar archivo/linea o fuente Azure.
3. Scope control: evitar over-engineering en el MVP.
4. Iteraciones cortas: maximo 3 rondas por tema critico.
5. Salida estructurada: mismo formato entre agentes para facilitar consolidacion.

## Requisitos no negociables

1. Mantener compatibilidad con la programming guide de OpenCode (estilo, flujo y guardrails).
2. Garantizar conectividad al MCP server de la empresa con estrategia de autenticacion y fallback.
3. Definir soporte en la app para invocacion explicita de herramienta via `/tool <nombre_tool> <objetivo>`.
4. Toda propuesta debe incluir controles de seguridad, permisos y auditoria.
5. Todo texto de producto (descripciones de tools, help y mensajes de UX) debe estar en ingles.

## Flujo de trabajo entre agentes

1. Agente 1 define el mapa real de tool-calling y gaps operativos.
2. Agente 2 define arquitectura objetivo y contratos de integracion.
3. Agente 3 arbitra hipotesis, conflictos y prioriza backlog ejecutable.
4. Agente 4 aterriza el dominio Azure en pipelines y endpoints concretos.
5. Agente 5 valida UX/calidad de herramientas MCP (`/tools`, `--help`, descripciones) y define backlog de mejoras.

## Entregables obligatorios por agente

- Hallazgos clave (5-10 puntos)
- Riesgos y anti-patrones
- Recomendaciones implementables
- Dependencias y bloqueadores
- Criterios de aceptacion de su dominio

Formato obligatorio de entrega:

- `05-TEMPLATE-ENTREGABLES.md`
- Consolidacion final: `06-CONSOLIDACION-FINAL.md`
- Anexo no negociables y `/tool`: `07-ANEXO-NO-NEGOCIABLES-Y-TOOL-COMMAND.md`
- Agente 5 (MCP tools help/description): `13-AGENTE-MCP-TOOLS-DX-HELP.md`

## Consolidacion final del plan

La consolidacion se considera lista cuando exista:

- un MVP claro de 90 dias,
- secuencia de fases (F0/F1/F2/F3),
- matriz de riesgos,
- tabla de prioridades (alto/medio/bajo),
- criterios de Go/No-Go definidos.
- validacion explicita de los 3 requisitos no negociables.

## Reglas de calidad

- No proponer componentes sin justificar valor.
- No mezclar diagnostico con implementacion.
- No esconder incertidumbre: marcar supuestos explicitos.
- Todo lo no validado debe ir como "hipotesis" y no como hecho.

## Estado de ejecucion

- Iteracion 1 ejecutada.
- Resultados por agente:
  - `08-RESULTADO-AGENTE-1-CALLING-TOOLS.md`
  - `09-RESULTADO-AGENTE-2-ARQUITECTURA.md`
  - `10-RESULTADO-AGENTE-3-IA-ORQUESTACION.md`
  - `11-RESULTADO-AGENTE-4-AZURE.md`
  - `14-RESULTADO-AGENTE-5-MCP-TOOLS-DX.md` (pendiente)
- Consolidacion actual:
  - `06-CONSOLIDACION-FINAL.md`
- Tracking de gestion:
  - `12-CLICKUP-PROJECT-TRACKING.md`
- Iteration 2 execution:
  - `16-ITERACION-2-PLAN-EJECUCION.md`
