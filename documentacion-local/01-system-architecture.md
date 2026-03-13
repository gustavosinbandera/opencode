# System architecture

## Vista general

OpenCode es un monorepo Bun + Turborepo con una arquitectura cliente/servidor:

1. CLI inicia en `packages/opencode/src/index.ts`.
2. El servidor HTTP inicia en `packages/opencode/src/server/server.ts`.
3. Clientes (TUI, web, desktop, IDE) consumen la misma API del servidor.

## Entry points principales

- CLI: `packages/opencode/src/index.ts`
- Server API: `packages/opencode/src/server/server.ts`
- Web app: `packages/app/src/entry.tsx`
- Desktop (Tauri runtime): `packages/desktop/src-tauri/src/main.rs`

## Flujo principal (happy path)

1. Usuario ejecuta `bun dev` o `opencode`.
2. Se inicializa logging, variables de proceso y migracion one-time de DB local.
3. Comandos CLI enrutan a TUI, server, web, MCP, ACP, etc.
4. Server crea contexto de workspace (`workspace`/`directory`) por request.
5. Rutas operan sobre proyecto, sesion, archivos, proveedores y eventos SSE.
6. Clientes escuchan `/event` para actualizaciones en tiempo real.

## Capas tecnicas observadas

- CLI orchestration: yargs + command registry.
- Server transport: Hono + OpenAPI + SSE.
- Contexto de ejecucion: `WorkspaceContext`, `Instance`, bootstrap por directorio.
- Integraciones: provider model, MCP, ACP, GitHub/PR commands.
- Persistencia local: migracion de JSON a DB sqlite al primer arranque detectado.

## Puertos y comportamiento por defecto

- API server usa 4096 por defecto cuando aplica.
- Web app en dev calcula server URL por `localStorage`, env vars o `location.origin`.
- Desktop fuerza exclusiones de loopback para proxy (`NO_PROXY`) en `main.rs`.

## Riesgos de arquitectura a vigilar

- Acoplamiento CLI/server alto en cambios de comandos.
- Multiples clientes consumiendo mismas rutas elevan impacto de breaking changes API.
- Fallback proxy `/*` a `https://app.opencode.ai` puede ocultar errores de rutas locales.
