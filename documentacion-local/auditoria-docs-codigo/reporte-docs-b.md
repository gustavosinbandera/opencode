# Afirmaciones documentales (Docs B)

**Workspace:** `C:\PROYECTOS\opencode`
**Alcance:** 05, 06, 10, 11, plan-distribuido-4-agentes, README, CONTRIBUTING, AGENTS

---

## Tabla resumen (muestra)

| Doc | Sección | Tipo | Afirmación |
|-----|---------|------|------------|
| 05-contribution-and-governance.md | Flujo dev | comando | bun install, bun dev, bun dev serve, bun run --cwd packages/app dev, bun run --cwd packages/desktop tauri dev. |
| 05 | Reglas técnicas | script | ./script/generate.ts si cambia API/SDK. |
| 06-docs-inventory-and-debt.md | Inventario | ruta | README.md, CONTRIBUTING.md, AGENTS.md; packages/web/src/content/docs/*.mdx; packages/opencode/src/acp/README.md; packages/sdk/openapi.json, /doc; packages/docs. |
| 10-mcp-tools-autocomplete-diagnosis.md | Flujo actual | ruta | autocomplete.tsx (resolveMcpToolIDs); index.tsx; experimental.ts GET /tool/ids; registry.ts; mcp/index.ts. |
| 10 | Causa raíz | endpoint | GET /tool/ids devuelve ToolRegistry.ids(); no MCP. |
| 10 | Solución | endpoint | Propuesta GET /experimental/tool/mcp-ids. |
| 11-mcp-server-proyecto-tools-y-exposicion.md | — | ruta | Proyecto externo MCP-SERVER: gateway/src, webapp; GET /mcp/tools, GET /mcp/tools/:name. |
| plan/00-PLAN-MAESTRO.md | Entregables | ruta | 05-TEMPLATE, 06-CONSOLIDACION, 07-ANEXO, 13-AGENTE-MCP; resultados 08-11, 14, 16, 17. |
| plan/15-SPEC-SLASH-TOOLS-UX.md | Commands | comando | /tools, /tool <name> <objective>, /tool <name> --help. |
| plan/17-MCP-TOOLS-DEBUG-HANDOFF.md | Command split | comando | /tool nativo; /mcp-tools MCP; /tools alias; /mcp-tools --debug. |
| README.md | Assets | ruta | packages/console/app/src/asset/logo-ornate-*.svg; packages/web/src/assets/lander/screenshot.png. |
| CONTRIBUTING.md | Developing | comando | Bun 1.3+; bun install, bun dev; bun dev serve (puerto 4096); bun run --cwd packages/app dev; bun run --cwd packages/desktop tauri dev. |
| CONTRIBUTING.md | Core pieces | ruta | packages/opencode, packages/app, packages/desktop, packages/plugin; TUI packages/opencode/src/cli/cmd/tui/. |
| CONTRIBUTING.md | API/SDK | script | ./script/generate.ts; packages/opencode/src/server/server.ts. |
| CONTRIBUTING.md | Web App | comando | Dev app en localhost:5173 o similar. |
| AGENTS.md | SDK | script | ./packages/sdk/js/script/build.ts para regenerar SDK JS. |
| AGENTS.md | Repo | flujo | Rama dev; tests no desde root. |

---

## Detalle por documento

- **05:** Comandos dev, pre-push typecheck, AGENTS.md estilo, .github/VOUCHED.td, ./script/generate.ts.
- **06:** Rutas de docs y API contract; packages/docs como superficie distinta.
- **10:** resolveMcpToolIDs, sdk.client.tool.ids(), GET /tool/ids (experimental), ToolRegistry.ids(), MCP.tools(); propuesta mcp-ids.
- **11:** MCP-SERVER (externo): gateway, webapp, /mcp/tools; relación OpenCode.
- **plan:** 00-PLAN-MAESTRO, 15-SPEC-SLASH-TOOLS-UX, 17-MCP-TOOLS-DEBUG-HANDOFF, 07-ANEXO, 13-AGENTE-MCP.
- **README:** Logo console/app, screenshot web/lander, CONTRIBUTING.
- **CONTRIBUTING:** bun dev, serve 4096, app dev (5173), desktop tauri dev, build.ts, generate.ts, VOUCHED.td.
- **AGENTS:** build.ts SDK, dev branch, tests desde packages.
