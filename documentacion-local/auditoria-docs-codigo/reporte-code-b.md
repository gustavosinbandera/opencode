# Hechos de código (Code B)

**Workspace:** `C:\PROYECTOS\opencode`
**Alcance:** packages/app, packages/desktop, packages/desktop-electron, packages/console, packages/ui, packages/sdk/js, packages/web

---

## 1. Entry points

| Paquete | Archivo / ruta | Notas |
|--------|-----------------|--------|
| **app** | packages/app/src/entry.tsx | Entry del front (Vite). |
| **app** | packages/app/vite.config.ts | Vite; HTML referencia /src/entry.tsx. |
| **desktop** (Tauri) | packages/desktop/src/entry.tsx | Entry front; packages/desktop/index.html. |
| **desktop** (Tauri) | packages/desktop/src-tauri/ | main.rs, lib.rs, tauri.conf.json; devUrl localhost:1420. |
| **desktop-electron** | packages/desktop-electron/src/main/index.ts | Proceso main. |
| **desktop-electron** | packages/desktop-electron/src/renderer/index.tsx | Entry renderer. |
| **console** (core) | — | Librería; exports en packages/console/core/package.json. |
| **console** (app) | packages/console/app/src/entry-client.tsx, entry-server.tsx | SolidStart. |
| **console** (function) | packages/console/function/src/ | Cloudflare Workers (auth, etc.). |
| **ui** | packages/ui/package.json, vite.config.ts | Lib; exports desde ./src/... |
| **sdk** (js) | packages/sdk/js/src/index.ts | Entry principal; export "." en package.json. |
| **web** | packages/web/astro.config.mjs | Astro; scripts dev/build. |

---

## 2. Puertos y APIs

| Paquete | Puerto | Rutas HTTP / APIs |
|--------|--------|--------------------|
| **app** | 3000 | packages/app/vite.config.ts server.port: 3000. No API propia. |
| **desktop** (Tauri) | 1420 (dev) | vite.config.ts server.port: 1420; tauri.conf.json devUrl localhost:1420. |
| **desktop-electron** | No fijo | electron-vite define dev server. |
| **console-app** | Por defecto Vite (ej. 5173) | Rutas API: auth, zen/v1/*, stripe/webhook, api/enterprise, openapi.json, etc. |
| **ui** | 3001 | vite.config.ts server.port: 3001 (solo dev). |
| **sdk** (js) | — | Librería; no servidor. |
| **web** | Por defecto Astro (ej. 4321) | astro.config.mjs server.host. |

---

## 3. Módulos / carpetas existentes

| Ruta relativa | Existe |
|---------------|--------|
| packages/app/src/entry.tsx | Sí |
| packages/app/src/context | Sí |
| packages/desktop/src-tauri | Sí |
| packages/desktop-electron/src/main | Sí |
| packages/console/core | Sí |
| packages/console/app | Sí |
| packages/ui/src | Sí |
| packages/sdk/js | Sí |
| packages/web | Sí |

---

## 4. Paquetes / dependencias workspace

- **packages/app:** @opencode-ai/sdk, @opencode-ai/ui, @opencode-ai/util (workspace:*)
- **packages/desktop:** @opencode-ai/app, @opencode-ai/ui (workspace:*)
- **packages/console/app:** @opencode-ai/console-core, console-mail, console-resource, @opencode-ai/ui (workspace:*)
- **packages/ui:** @opencode-ai/sdk, @opencode-ai/util (workspace:*)
- **packages/sdk/js:** Sin dependencias workspace:*.

---

*Reporte generado a partir del código en el workspace.*
