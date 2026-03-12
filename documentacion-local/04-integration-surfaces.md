# Integration surfaces

## Superficies de entrada

- CLI commands: `packages/opencode/src/index.ts` registra ACP, MCP, web, serve, PR, etc.
- API server: `packages/opencode/src/server/server.ts` expone rutas para app, session y mcp.
- Web client: `packages/app/src/entry.tsx` consume servidor HTTP configurable.
- Desktop: `packages/desktop` (Tauri) y `packages/desktop-electron` (Electron).

## ACP y MCP

- ACP command habilitado en CLI (`AcpCommand`).
- MCP command y rutas server presentes (`McpCommand`, `.route("/mcp", McpRoutes())`).
- Esto permite herramientas externas y agentes conectados a la sesion/workspace.

## IDE y SDK

- VS Code integration en `sdks/vscode` con lifecycle propio de lint/test/build.
- SDK JS en `packages/sdk/js` y contrato API derivado de OpenAPI.
- Cambios de rutas server deben reflejarse en regeneracion de SDK.

## Ecosistema externo

- GitHub Action runtime bajo `github/`.
- Slack integration en `packages/slack`.
- Infra de despliegue en `infra/` (SST app/console/enterprise).

## Puntos de compatibilidad critica

- Versionamiento de API vs clientes desacoplados (desktop/web/ide/action).
- Cambios en auth/CORS afectan consumo remoto y embebidos.
- Cambios de SSE (`/event`) impactan realtime UX y sincronizacion de estados.
