# Matriz Minima de Validacion por Sync

Fecha: 2026-03-13

## Criterio general

Todo sync upstream debe pasar esta matriz antes de promoverse a rama estable.

## Smoke checks (obligatorios)

- [ ] Arranca CLI/TUI sin errores.
- [ ] Slash nativo `/tool` lista y ejecuta flujo base.
- [ ] Slash MCP `/mcp-tools` lista herramientas locales.
- [ ] `/mcp-tools <tool> --help` muestra schema/descripcion.
- [ ] `/mcp-tools <tool> <args>` ejecuta y devuelve salida.
- [ ] Ruta MCP `/mcp/tools?scope=local` responde ids consistentes.
- [ ] Ruta MCP `/mcp/call` responde salida util o error legible.
- [ ] Endpoint Azure evidence (`POST /azure/evidence/bug`) responde sin regresion.

## Policy runtime checks (nueva capa)

- [ ] Perfil `strict`: comandos destructivos en bash son bloqueados.
- [ ] Perfil `strict`: contexto-only no dispara ejecucion medium/high.
- [ ] Perfil `balanced`: commit/push pide confirmacion (ask).
- [ ] Perfil `fast`: no aplica bloqueos adicionales salvo permisos base.

## Gate de calidad

- [ ] `bun run typecheck` en `packages/opencode`.
- [ ] Tests de policy (`src/policy/engine.test.ts`).
- [ ] No hay cambios pendientes no intencionales (`git status --short`).

## Evidencia de ejecucion

- [ ] Captura de comandos usados.
- [ ] Hash de commit final del ciclo.
- [ ] Nota corta de riesgos abiertos (si aplica).
