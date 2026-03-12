# Package code map: desktop

## Scope

Paquetes:

- `packages/desktop` (Tauri)
- `packages/desktop-electron` (Electron)

Responsabilidad: shells nativos para ejecutar la experiencia de app fuera del navegador.

## Entrypoints

- Tauri rust main: `packages/desktop/src-tauri/src/main.rs`
- Tauri frontend: `packages/desktop/src/entry.tsx`
- Electron main: `packages/desktop-electron/src/main/index.ts`

## Flujo tecnico resumido

### Tauri

1. `main.rs` ajusta `NO_PROXY/no_proxy` para loopback.
2. En Linux selecciona backend de display (wayland/x11/auto).
3. Ejecuta `opencode_lib::run()`.

### Electron

1. `electron-vite` levanta procesos main/preload/renderer.
2. Consume `@opencode-ai/app` y estado local de desktop.

## Riesgos de cambio

- Cambios en proxy/env pueden romper acceso a server local.
- Cambios de empaquetado afectan distribucion por plataforma.
- Cambios de version de plugins Tauri/Electron pueden romper runtime.

## Validaciones minimas sugeridas

- Tauri dev: `bun run --cwd packages/desktop tauri dev`
- Electron dev: `bun run --cwd packages/desktop-electron dev`
- Verificar conectividad local al server con auth habilitada.
