# Hechos de código (Code A)

**Workspace:** `C:\PROYECTOS\opencode` — solo paquete `packages/opencode/`

---

## 1. Entry points

- **`packages/opencode/src/index.ts`**
  Punto de entrada principal: arranca yargs, registra comandos CLI y opciones globales (scriptName `opencode`, version, log-level, etc.).

- **`packages/opencode/bin/opencode`**
  Binario declarado en `package.json` (`"bin": { "opencode": "./bin/opencode" }`). Script Node que resuelve el ejecutable por plataforma/arquitectura (p. ej. `opencode-darwin-arm64`, `opencode-win32-x64`) dentro de `node_modules` y lo ejecuta con los mismos argumentos.

- **Comandos CLI registrados en `src/cli/cmd/`** (nombres tal como aparecen en `src/index.ts` y en cada módulo):

  | Comando principal | Subcomandos (donde aplica) |
  |-------------------|----------------------------|
  | `acp` | — |
  | `mcp` | list, auth, logout, add, debug; auth list |
  | `$0` (tui/thread) | — |
  | `attach <url>` | — |
  | `run [message..]` | — |
  | `generate` | — |
  | `debug` | config, lsp, rg, file, scrap, skill, snapshot, agent, wait, paths |
  | `auth` | login, logout, list |
  | `agent` | create, list |
  | `upgrade [target]` | — |
  | `uninstall` | — |
  | `serve` | — |
  | `web` | — |
  | `models [provider]` | — |
  | `stats` | — |
  | `export [sessionID]` | — |
  | `import <file>` | — |
  | `github` | install, run |
  | `pr <number>` | — |
  | `session` | list, delete |
  | `db` | $0 [query], path, migrate |
  | `workspace-serve` | (solo si `Installation.isLocal()`) |

  Nombres de comando de primer nivel: **acp**, **mcp**, **tui** (thread, `$0 [project]`), **attach**, **run**, **generate**, **debug**, **auth**, **agent**, **upgrade**, **uninstall**, **serve**, **web**, **models**, **stats**, **export**, **import**, **github**, **pr**, **session**, **db**, **workspace-serve**.

---

## 2. Rutas HTTP

Definidas en `packages/opencode/src/server/routes/` y montadas en `packages/opencode/src/server/server.ts`. Prefijo base: raíz del servidor.

### `routes/global.ts` → prefijo **/global**
- GET /global/health (global.health)
- GET /global/event (global.event)

### `routes/project.ts` → prefijo **/project**
- GET /project/ (project.list), GET /project/current, POST /project/git/init, PATCH /project/:projectID

### `routes/session.ts` → prefijo **/session**
- session.list, session.status, session.get, session.create, session.delete, session.update, session.fork, session.abort, session.prompt, session.messages, session.diff, session.revert, session.unrevert, permission.reply, part.delete, part.update, etc.

### `routes/mcp.ts` → prefijo **/mcp**
- GET /mcp/tools (mcp.tools)
- POST /mcp/call (mcp.callTool) — si existe
- GET /mcp/ (mcp.status)
- POST /mcp/, POST /mcp/:name/auth, POST /mcp/:name/auth/callback, POST /mcp/:name/auth/authenticate, DELETE /mcp/:name/auth, POST /mcp/:name/connect, POST /mcp/:name/disconnect

### `routes/experimental.ts` → prefijo **/experimental**
- GET /experimental/tool/ids (tool.ids)
- GET /experimental/tool (tool.list)
- POST/GET/DELETE /experimental/workspace, POST/GET/DELETE /experimental/worktree, GET /experimental/session, GET /experimental/resource

### `routes/tui.ts` → prefijo **/tui**
- GET /tui/control/next, POST /tui/control/response, POST /tui/append-prompt, /tui/open-help, /tui/open-sessions, /tui/open-themes, /tui/open-models, /tui/submit-prompt, /tui/clear-prompt, /tui/execute-command, /tui/show-toast, /tui/publish, /tui/select-session

### `routes/config.ts` → prefijo **/config**
- GET /config/, PATCH /config/, GET /config/providers

### `routes/file.ts` → montado en raíz
- GET /find, /find/file, /find/symbol, GET /file, /file/content, /file/status

### `routes/pty.ts` → prefijo **/pty**
- GET/POST /pty/, GET /pty/:ptyID, PUT /pty/:ptyID, DELETE /pty/:ptyID, GET /pty/:ptyID/connect (WebSocket)

### `routes/provider.ts` → prefijo **/provider**
- GET /provider/, GET /provider/auth, POST /provider/:providerID/oauth/authorize, POST /provider/:providerID/oauth/callback

### `routes/permission.ts`, `routes/question.ts`, `routes/azure.ts`
- permission.reply, permission.list; question.list, question.reply, question.reject; azure.evidence.bug

### En `server.ts` (sin archivo en routes/)
- PUT /auth/:providerID, DELETE /auth/:providerID, GET /doc (OpenAPI), POST /instance/dispose

---

## 3. Módulos/carpetas existentes

| Ruta relativa | ¿Existe? |
|---------------|----------|
| packages/opencode/src/mcp/index.ts | Sí |
| packages/opencode/src/tool/registry.ts | Sí |
| packages/opencode/src/session/prompt.ts | Sí |
| packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx | Sí |
| packages/opencode/src/server/server.ts | Sí |
| packages/opencode/src/server/routes/experimental.ts | Sí |
| packages/opencode/src/server/routes/mcp.ts | Sí |

---

## 4. Paquetes referenciados (monorepo)

Del `packages/opencode/package.json`:
- **name:** opencode
- **bin:** "opencode": "./bin/opencode"
- **Dependencias workspace:*:** @opencode-ai/plugin, @opencode-ai/script, @opencode-ai/sdk, @opencode-ai/util
- **catalog:** @hono/zod-validator, ai, hono, hono-openapi, zod, etc.

---

*Reporte generado por verificación directa del código en packages/opencode.*
