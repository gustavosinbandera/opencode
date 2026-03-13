# Anexo: No Negociables Y Comando /tool

## Objetivo del anexo

Aterrizar en pasos concretos los requisitos no negociables del proyecto:

1. Mantener programming guide de OpenCode.
2. Conectar MCP server de la empresa.
3. Habilitar invocacion explicita por `/tool <nombre_tool> <objetivo>`.

## Reparticion por agente (responsabilidad primaria)

### Agente 1 - Calling Tools Architect

- Define especificacion funcional y tecnica de `/tool`.
- Propone validaciones de nombre de herramienta, argumentos y permisos.
- Define estados y errores esperados (tool no existe, tool sin permiso, timeout).

### Agente 2 - Arquitectura/Microservicios

- Define el contrato API para ejecutar tools de forma explicita.
- Define observabilidad y auditoria para `/tool`.
- Define estrategia de rollback y feature flag para despliegue gradual.

### Agente 3 - IA/Orquestacion

- Define como convive `/tool` con flujo agentico automatico.
- Define reglas de prioridad cuando usuario fuerza herramienta especifica.
- Define rubrica de calidad para respuestas asistidas por `/tool`.

### Agente 4 - Azure DevOps Specialist

- Define como `/tool` puede invocar herramientas Azure sin romper seguridad.
- Define permisos minimos para lectura de work items/changesets/diffs.
- Define evidencias obligatorias en resultados de herramientas Azure.

## Especificacion funcional minima de `/tool`

- Formato base: `/tool <nombre_tool> <objetivo>`
- Ejemplo 1: `/tool usar-mcp_azure_get_work_item obtener bug 12345`
- Ejemplo 2: `/tool usar-mcp_grep_code buscar "currency" en branch blueivory`

## Reglas funcionales

1. Si la herramienta no existe, responder error claro + sugerencias.
2. Si no hay permisos, responder deny con razon auditable.
3. Si la herramienta falla por dependencia externa, responder con estado recoverable.
4. La respuesta debe separar:
   - resultado bruto,
   - interpretacion IA,
   - siguiente paso recomendado.

## Requisitos de seguridad

- Toda ejecucion `/tool` debe quedar auditada con usuario, tool, tiempo y estado.
- No exponer secretos ni tokens en respuesta.
- Aplicar allowlist de herramientas segun entorno (dev/staging/prod).
- En herramientas de escritura, exigir confirmacion de politica (o bloqueo por defecto en MVP).

## Requisitos de compatibilidad con OpenCode

- Mantener semantica existente de slash commands.
- No romper flow actual de prompt normal ni tool-calling automatico.
- Respetar conventions del programming guide para cambios en CLI/TUI/server.

## Criterios de aceptacion de este anexo

1. Existe definicion E2E de `/tool` (UX, API, permisos, auditoria).
2. Hay plan de integracion MCP empresa con validacion de conectividad.
3. La consolidacion final evidencia que se preserva la programming guide.
