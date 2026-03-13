# Reporte consolidado - Auditoría documentación vs código

**Workspace:** C:\PROYECTOS\opencode  
**Agente:** 5 (Consolidador)  
**Fuentes:** reporte-code-a.md, reporte-code-b.md, reporte-docs-a.md, reporte-docs-b.md  

---

## Resumen ejecutivo

Se ha realizado el cruce entre las afirmaciones documentales (docs 01–11, planes, README, CONTRIBUTING, AGENTS) y los hechos de código (packages/opencode, app, desktop, console, ui, sdk, web). La documentación de arquitectura (01–04, 07–09) coincide en gran medida con el código en entry points, servidor y rutas HTTP; el puerto por defecto 4096 del servidor (`bun dev serve`) está confirmado en `server.ts` (tryServe(4096)).

Se detectan discrepancias acotadas: puerto de la "Web App" en CONTRIBUTING (5173 vs 3000 para packages/app), redacción de la ruta GET /tool/ids como GET /experimental/tool/ids en doc 10, y posibles omisiones (scripts en raíz, ruta exacta de build SDK en AGENTS). No hay un bloqueo crítico ni un área con tantas incoherencias como para pedir una re-verificación masiva por otro agente.

**Decisión:** No se requiere iteración. El plan de correcciones siguiente es suficiente para alinear docs y código.

**Conclusión:** La base documental está mayormente alineada con el código. Las correcciones propuestas son puntuales (puertos, rutas, paths de scripts y aclaraciones de alcance).

---

## Comentarios del consolidador por área

### Rutas HTTP (packages/opencode)

- **Coincidencias:** Las rutas citadas en 01 y 03 (/global, /project, /session, /mcp, /tui, /event, /doc, /experimental, /pty, /config, /permission, /question, /provider) existen en código. GET /event está en raíz en `server.ts`; /global/event en `routes/global.ts`. Prefijos y archivos en `routes/` coinciden.
- **Discrepancia (menor):** En doc 10 se habla de "GET /tool/ids en experimental". En código la ruta es **GET /experimental/tool/ids**. La afirmación es correcta en contenido pero incompleta en path.
  - **Gravedad:** Menor (confuso).
  - **Sugerencia:** En 10-mcp-tools-autocomplete-diagnosis.md indicar explícitamente la ruta completa: GET /experimental/tool/ids.

### Entry points y rutas de archivo

- **Coincidencias:** CLI en `packages/opencode/src/index.ts`, servidor en `packages/opencode/src/server/server.ts`, web app en `packages/app/src/entry.tsx`, desktop Tauri en `packages/desktop/src-tauri/src/main.rs`, desktop-electron en `packages/desktop-electron/src/main/index.ts` y renderer. 07, 08 y 09 coinciden con code-a/code-b.
- **Omisión (menor):** Los reportes de código no listan `packages/opencode/src/acp/` ni `packages/opencode/src/acp/README.md` que menciona el doc 06. No implica que no existan; solo no fueron verificados en esta auditoría.
  - **Sugerencia:** Dejar como está o que un inventario futuro confirme existencia de `packages/opencode/src/acp/README.md`.

### Puertos

- **Coincidencia:** Puerto 4096 para el API server (serve) está en código: `server.ts` usa `tryServe(4096)` cuando `opts.port === 0`.
- **Discrepancia (confuso):** CONTRIBUTING y reporte-docs-b indican "Web App" dev en "localhost:5173 o similar". En código, **packages/app** tiene `server.port: 3000` en `vite.config.ts`; el puerto 5173 corresponde al **console app** (Vite por defecto). Si "Web App" se refiere a packages/app, el puerto documentado es erróneo.
  - **Gravedad:** Confuso (puede desorientar a quien sigue CONTRIBUTING).
  - **Sugerencia:** En CONTRIBUTING aclarar: "Web App" (packages/app) → puerto 3000; si se habla de console app, indicar 5173 (o "Vite por defecto") y nombrar explícitamente "Console app".

### Scripts y comandos

- **Coincidencias:** `bun dev serve`, `bun run --cwd packages/app dev`, `bun run --cwd packages/desktop tauri dev`, `./script/generate.ts` (existe en raíz). CONTRIBUTING y 05 están alineados.
- **Posible omisión:** AGENTS menciona `./packages/sdk/js/script/build.ts` para regenerar SDK JS. El archivo existe; la ruta es correcta. No hay discrepancia.
- **Aclaración:** Doc 05/CONTRIBUTING citan `./script/generate.ts` cuando cambia API/SDK; el reporte de código no detalla este script pero el archivo está en la raíz; se considera OK.

### Documentación e inventario (doc 06)

- **Coincidencias:** README.md, CONTRIBUTING.md, AGENTS.md, packages/web (contenido docs), /doc (OpenAPI), packages/docs (existe en el repo). packages/sdk/openapi.json y referencias a API contract son coherentes.
- **Sin omisiones relevantes** en esta área para los ítems contrastados.

### MCP y experimental (docs 10 y 11)

- **Coincidencia:** Doc 10 describe autocomplete, resolveMcpToolIDs, ToolRegistry.ids(), GET /experimental/tool/ids en código; la causa raíz y la propuesta GET /experimental/tool/mcp-ids son coherentes con el código.
- **Aclaración:** Doc 11 describe el proyecto **externo** MCP-SERVER (gateway, webapp, GET /mcp/tools). En opencode, code-a confirma GET /mcp/tools; no se contrasta GET /mcp/tools/:name porque 11 se refiere al servidor externo. Sin discrepancia para el repo opencode.

### Planes y README/CONTRIBUTING/AGENTS

- **Coincidencias:** Referencias a resultados, comandos /tools y /mcp-tools en planes; README a logo (console/app) y screenshot (web); CONTRIBUTING a "core pieces" (opencode, app, desktop, plugin, TUI). AGENTS: build.ts SDK, rama dev, tests desde packages.
- **Omisión menor:** "Core pieces" en CONTRIBUTING no menciona console, web, sdk; no es incorrecto si se consideran "core" solo opencode/app/desktop/plugin. Sugerencia opcional: añadir una línea que indique que console, web y sdk también forman parte del monorepo si se quiere exhaustividad.

---

## Resultado del cruce

| Afirmación doc | Hecho código | Estado |
|----------------|--------------|--------|
| CLI en packages/opencode/src/index.ts | index.ts entry, yargs, comandos CLI | OK |
| Servidor en packages/opencode/src/server/server.ts | server.ts, Server.createApp, listen | OK |
| Web app packages/app/src/entry.tsx | packages/app/src/entry.tsx, Vite | OK |
| Desktop packages/desktop/src-tauri/src/main.rs | main.rs en src-tauri/src/ | OK |
| API server puerto 4096 por defecto | Server.listen tryServe(4096) cuando port===0 | OK |
| Rutas /global, /project, /session, /mcp, /tui, /event, /doc, /experimental | Todas presentes en routes/ y server.ts | OK |
| GET /event (SSE) | GET /event en server.ts, streamSSE | OK |
| GET /tool/ids en experimental | GET /experimental/tool/ids en experimental.ts | Incompleto (falta prefijo /experimental en doc) |
| bun dev serve (puerto 4096) | listen(4096) en serve | OK |
| bun run --cwd packages/app dev | entry.tsx, vite dev | OK |
| bun run --cwd packages/desktop tauri dev | Tauri, entry.tsx, src-tauri | OK |
| ./script/generate.ts (API/SDK) | script/generate.ts en raíz existe | OK |
| packages/opencode, app, desktop, plugin, TUI (CONTRIBUTING) | Existen; TUI en cli/cmd/tui/ | OK |
| Dev app localhost:5173 (CONTRIBUTING "Web App") | packages/app port 3000; console 5173 | Desactualizado |
| GET /experimental/tool/ids (doc 10 flujo) | experimental/tool/ids en código | OK (si se escribe ruta completa en doc) |
| packages/docs (doc 06) | packages/docs existe | OK |
| AGENTS build.ts SDK (packages/sdk/js/script/build.ts) | build.ts existe en sdk/js/script/ | OK |
| README assets (logo console, screenshot web) | Rutas típicas en app/web | OK |
| Doc 11 MCP-SERVER externo /mcp/tools | Proyecto externo; opencode tiene /mcp/tools | N/A (externo) |

---

## Decisión de iteración

**No se requiere iteración.** El cruce es claro; las discrepancias y omisiones están localizadas y no exigen una re-verificación amplia por otro agente. El plan de correcciones siguiente es ejecutable directamente.

---

## Plan de correcciones

1. **CONTRIBUTING.md (sección Developing / Web App)**
   - **Cambio:** Aclarar puerto de la "Web App": si es packages/app, indicar que el dev server usa **puerto 3000** (o "según vite.config, por defecto 3000"). Si se incluye la "Console app", indicar que esta usa el puerto por defecto de Vite (ej. 5173) y nombrarla explícitamente.
   - **Referencia:** reporte-docs-b, reporte-code-b (app port 3000, console 5173).

2. **10-mcp-tools-autocomplete-diagnosis.md (flujo actual / endpoint experimental)**
   - **Cambio:** Donde se mencione "GET /tool/ids" en el contexto del servidor opencode, escribir la ruta completa: **GET /experimental/tool/ids**.
   - **Referencia:** reporte-docs-a (tabla muestra), reporte-code-a (routes/experimental.ts).

3. **CONTRIBUTING.md (opcional)**
   - **Cambio:** En "Core pieces" o equivalente, considerar añadir una mención breve a console, web y sdk como parte del monorepo si se quiere que el inventario sea explícito.
   - **Referencia:** reporte-code-b (módulos existentes).

4. **README o doc de arquitectura (opcional)**
   - **Cambio:** Si en algún sitio se dice solo "app en 5173" sin distinguir app vs console, unificar con CONTRIBUTING: app → 3000, console → 5173 (o "Vite default").
   - **Referencia:** Misma que 1.

5. **Verificación post-corrección**
   - Tras aplicar 1 y 2, comprobar que no queden referencias a "5173" para packages/app ni a "/tool/ids" sin el prefijo /experimental en el contexto del API de opencode.

---

*Reporte consolidado generado por Agente 5 a partir de reporte-code-a.md, reporte-code-b.md, reporte-docs-a.md y reporte-docs-b.md.*
