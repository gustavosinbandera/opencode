# Package code map: opencode

## Scope

Paquete: `packages/opencode`.

Responsabilidad: CLI principal, servidor HTTP, sesiones, providers, tools, y coordinacion de workspace.

## Entrypoints

- CLI: `packages/opencode/src/index.ts`
- Web command: `packages/opencode/src/cli/cmd/web.ts`
- Server app: `packages/opencode/src/server/server.ts`

## Flujo tecnico resumido

1. `src/index.ts` registra comandos y config global (logs, env, errores).
2. En primer arranque, ejecuta migracion one-time JSON -> sqlite.
3. Comandos `serve` y `web` levantan `Server.listen(...)`.
4. `server.ts` aplica auth, logging, CORS, contexto workspace y rutas funcionales.
5. `/event` publica SSE para estado y eventos de runtime.

## Subdominios internos visibles

- `src/cli/*`: UX de terminal, parseo de comandos y control de flags.
- `src/server/*`: rutas HTTP, errores API, transporte y middleware.
- `src/session/*`: estado conversacional y contexto operativo.
- `src/provider/*`: adaptadores de modelos y proveedores.
- `src/tool/*`: herramientas del agente (read/edit/bash/etc).
- `src/storage/*`: persistencia y migraciones.

## Riesgos de cambio

- Cambios en `server.ts` pueden romper clientes web/desktop/SDK.
- Cambios en comando `web` afectan onboarding y DX local.
- Cambios en bootstrap de DB impactan arranques en maquinas nuevas.

## Validaciones minimas sugeridas

- `bun run --cwd packages/opencode --conditions=browser src/index.ts --help`
- `bun dev serve --port <port>`
- `curl` sin auth y con auth a `/path` para confirmar basic auth.
