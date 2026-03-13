# Module boundaries (monorepo)

## Estructura raiz

- `packages/*`: paquetes de producto (core, app, desktop, web, sdk, plugin, etc).
- `packages/console/*`: servicios de consola separados por dominio.
- `sdks/vscode`: extension VS Code.
- `infra`: definiciones SST para despliegue.
- `github`: runtime de GitHub Action.
- `script`: automatizacion de release, versionado y tareas de repo.

## Modulos clave y responsabilidad

- `packages/opencode`: core del producto (CLI, server, sesiones, tools, providers).
- `packages/app`: UI web compartida (SolidJS + Vite).
- `packages/desktop`: shell nativo Tauri que envuelve app/web.
- `packages/desktop-electron`: shell desktop alterno por Electron.
- `packages/web`: sitio de documentacion y contenido publico.
- `packages/sdk/js`: SDK JS generado/consumido por clientes.
- `packages/plugin`: superficie de plugins.
- `packages/slack`: integracion Slack.

## Limites recomendados

- `opencode` define contratos de server y comportamiento core.
- `app` y `desktop*` no deben reimplementar logica de negocio del server.
- `sdk/js` debe versionarse siguiendo cambios de OpenAPI/route handlers.
- `web` es capa documental; no debe contener reglas de runtime de producto.

## Toolchain y control transversal

- Package manager canonicamente configurado: Bun (`packageManager: bun@1.3.10`).
- Orquestacion multi-paquete: Turborepo (`turbo.json`).
- Pre-push hook: validacion de version Bun + typecheck.

## Dependencias compartidas que marcan frontera

- API/transport: Hono, hono-openapi, zod.
- UI: SolidJS, Vite, Tailwind.
- Data/local persistence: drizzle-*.
- Infra: SST.

## Senales de deuda o ambiguedad

- Existen dos superficies de docs (`packages/web` y `packages/docs`) con posible overlap.
- Algunos README de paquetes parecen boilerplate y no documentan ownership real.
