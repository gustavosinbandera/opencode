# Afirmaciones documentales (Docs A)

Reporte del Agente 3 (Docs A) — auditoría docs vs código. Afirmaciones contrastables extraídas de documentación local (01-04, 07-09).

---

## Resumen por documento

- **01-system-architecture.md:** CLI en packages/opencode/src/index.ts; server en packages/opencode/src/server/server.ts; web app packages/app/src/entry.tsx; desktop packages/desktop/src-tauri/src/main.rs; flujo bun dev/opencode; puerto 4096; /event; proxy /* a app.opencode.ai.
- **02-module-boundaries-monorepo.md:** packages/*, packages/console/*, sdks/vscode, infra, github; paquetes opencode, app, desktop, desktop-electron, web, sdk/js, plugin, slack; Bun, turbo.json; Hono, SolidJS, Vite, Drizzle, SST.
- **03-api-service-layers.md:** server en packages/opencode/src/server/server.ts; rutas /global, /project, /pty, /config, /experimental, /session, /permission, /question, /provider, /mcp, /tui, /doc, /event; workspace/directory; streamSSE heartbeat 10s; catch-all /* proxy.
- **04-integration-surfaces.md:** CLI packages/opencode/src/index.ts; API packages/opencode/src/server/server.ts; web packages/app/src/entry.tsx; desktop packages/desktop, desktop-electron; ACP/MCP; sdks/vscode; packages/sdk/js; github/, packages/slack, infra/.
- **07-package-opencode-code-map.md:** packages/opencode CLI/server/session; index.ts, web.ts, server.ts; migración JSON->sqlite; serve/web Server.listen; /event; src/cli/*, src/server/*, src/session/*, src/provider/*, src/tool/*, src/storage/*; comandos bun run --cwd packages/opencode, bun dev serve, curl /path.
- **08-package-app-code-map.md:** packages/app entry.tsx, index.html; localStorage defaultServerUrl, VITE_OPENCODE_SERVER_*, location.origin; ServerConnection.Http, AppInterface; bun run --cwd packages/app dev.
- **09-package-desktop-code-map.md:** packages/desktop (Tauri), packages/desktop-electron; main.rs, desktop/src/entry.tsx, desktop-electron/src/main/index.ts; NO_PROXY, wayland/x11, opencode_lib::run(); electron-vite; @opencode-ai/app; bun run --cwd packages/desktop tauri dev; bun run --cwd packages/desktop-electron dev.

---

## Tabla de afirmaciones (muestra)

| Doc | Sección | Tipo | Afirmación |
|-----|---------|------|------------|
| 01-system-architecture.md | Vista general | ruta/archivo | CLI en packages/opencode/src/index.ts. |
| 01-system-architecture.md | Vista general | ruta/archivo | Servidor en packages/opencode/src/server/server.ts. |
| 01-system-architecture.md | Entry points | ruta/archivo | Web app packages/app/src/entry.tsx. |
| 01-system-architecture.md | Entry points | ruta/archivo | Desktop packages/desktop/src-tauri/src/main.rs. |
| 01-system-architecture.md | Puertos | endpoint/puerto | API server puerto 4096 por defecto. |
| 03-api-service-layers.md | Rutas principales | endpoint | Rutas /global, /project, /session, /mcp, /tui, /event, /doc, /experimental. |
| 07-package-opencode-code-map.md | Entrypoints | ruta/archivo | CLI packages/opencode/src/index.ts; Server packages/opencode/src/server/server.ts. |
| 10-mcp-tools-autocomplete-diagnosis (ref) | — | endpoint | GET /tool/ids en experimental; doc 10 dice GET /tool/ids, código tiene GET /experimental/tool/ids. |

Total: 149 afirmaciones contrastables en los 7 documentos (lista completa en salida del agente 3).
