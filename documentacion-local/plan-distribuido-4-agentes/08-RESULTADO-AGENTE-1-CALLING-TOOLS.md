# Resultado Agente 1 - Calling Tools

## 1) Identificacion

- Agente: 1
- Rol: Calling Tools Architect
- Fecha: 2026-03-12
- Version: v1.0

## 2) Resumen ejecutivo

- Hallazgo principal: OpenCode ya tiene loop robusto de tool-calling, pero hoy no existe canal explicito `/tool <nombre_tool> <objetivo>`.
- Hallazgo de riesgo: command templates permiten shell embebida (`!\`cmd\``) y requieren hardening enterprise.
- Confianza: alta.

## 3) Hallazgos clave

1. Lifecycle tool-call confirmado (`pending/running/completed/error`) en `C:\PROYECTOS\opencode\packages\opencode\src\session\processor.ts:111`.
2. Validacion de argumentos centralizada en `C:\PROYECTOS\opencode\packages\opencode\src\tool\tool.ts:59`.
3. Modelo permisos `allow/deny/ask` activo, con TODO de persistencia always en `C:\PROYECTOS\opencode\packages\opencode\src\permission\next.ts:227`.
4. Slash actual enruta a command known list; `/tool` no existe por defecto (`C:\PROYECTOS\opencode\packages\app\src\components\prompt-input\submit.ts:268`).
5. Riesgo alto de shell embebida en command template (`C:\PROYECTOS\opencode\packages\opencode\src\session\prompt.ts:1781`).

## 4) Recomendaciones implementables

- Crear Capability Registry minimo (tipo, riesgo, permisos, auditoria).
- Implementar `/tool <nombre_tool> <objetivo>` como comando reservado con validacion estricta.
- Endurecer `SessionPrompt.command` para shell embebida con gate de permisos explicito.

## 5) Validacion no negociables

- Programming guide OpenCode: si.
- MCP empresa: si (base tecnica ya disponible).
- `/tool <nombre_tool> <objetivo>`: cubierto en plan, no implementado aun.

## 6) Convergencia

- Point: parser slash + `session.command` + `Command.list`.
- Symptom Link: sin `/tool` reservado, no hay invocacion explicita auditable de herramienta.
- Confidence: 89/100.
