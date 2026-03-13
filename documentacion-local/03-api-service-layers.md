# API and service layers

## Server bootstrap

Servidor principal en `packages/opencode/src/server/server.ts`.

Pipeline observado:

1. `onError` centralizado con conversion a `NamedError` cuando aplica.
2. Auth opcional por basic auth si hay flags `OPENCODE_SERVER_PASSWORD`.
3. Request logging y timing.
4. CORS con allowlist local + dominios `*.opencode.ai` + extras por opciones.
5. Inyeccion de `WorkspaceContext` e `Instance` por request.

## Rutas principales

- `/global`
- `/project`
- `/pty`
- `/config`
- `/experimental`
- `/session`
- `/permission`
- `/question`
- `/provider`
- `/mcp`
- `/tui`
- `/doc` (OpenAPI)
- `/event` (SSE)

## Comportamientos relevantes

- Resolucion de workspace via query/header: `workspace`, `x-opencode-workspace`.
- Resolucion de directorio via `directory`, `x-opencode-directory`, o `process.cwd()`.
- `streamSSE` en `/event` envia `server.connected` y heartbeat cada 10s.
- Route catch-all `/*` proxya a `https://app.opencode.ai`.

## Contratos y clientes

- Contrato OpenAPI generado por `openAPIRouteHandler` y `generateSpecs`.
- Clientes esperados: CLI TUI, web app, desktop wrappers, integraciones remotas.
- Endpoint `/doc` es referencia para sincronizar SDK.

## Validacion recomendada al tocar server

- Revisar impacto en `packages/opencode/src/server/routes/*`.
- Regenerar artefactos de SDK si cambia API (`CONTRIBUTING.md` menciona `./script/generate.ts`).
- Probar al menos flujo de auth, session y event stream.
