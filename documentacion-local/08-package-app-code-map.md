# Package code map: app

## Scope

Paquete: `packages/app`.

Responsabilidad: cliente web SolidJS/Vite que consume el server de OpenCode.

## Entrypoints

- App entry: `packages/app/src/entry.tsx`
- HTML host: `packages/app/index.html`

## Flujo tecnico resumido

1. `entry.tsx` detecta locale y prepara `PlatformProvider`.
2. Resuelve server URL por prioridad:
   - localStorage (`opencode.settings.dat:defaultServerUrl`)
   - entorno dev (`VITE_OPENCODE_SERVER_HOST/PORT`)
   - `location.origin` en produccion.
3. Crea `ServerConnection.Http` y monta `AppInterface`.

## Integraciones funcionales

- Notifications web via `Notification` API.
- Navegacion browser (`back`, `forward`, `reload`).
- Persistencia de server por localStorage.

## Riesgos de cambio

- Cambios en resolucion de URL afectan conexion con server local/remoto.
- Cambios en `AppInterface` o `ServerConnection` impactan desktop wrappers.

## Validaciones minimas sugeridas

- `bun run --cwd packages/app dev`
- Confirmar que conecta a `http://127.0.0.1:<port>/`.
- Confirmar fallback de URL y persistencia de server default.
