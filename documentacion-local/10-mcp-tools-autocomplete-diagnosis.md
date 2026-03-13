# Diagnóstico: /mcp-tools no lista herramientas MCP en el autocomplete

**Fecha:** 2025-03-12  
**Ámbito:** TUI, área de prompt, comando `/mcp-tools`  
**Estado:** Análisis y propuesta de solución (sin implementar)

---

## 1. Resumen del problema

Cuando el usuario escribe o selecciona `/mcp-tools` en el área de prompts, se espera que el autocomplete muestre la lista de herramientas MCP disponibles. En la práctica **no se listan** (o solo aparece "No MCP tools loaded" y "Run /mcp-tools --debug").

---

## 2. Flujo actual

```
Usuario escribe "/" → menú de comandos (incluye mcp-tools)
Usuario selecciona "mcp-tools" → texto "/mcp-tools " → autocomplete en modo tools

Autocomplete (autocomplete.tsx):
  1. toolsQuery = true (visible "/" y texto empieza con "mcp-tools" o "tools")
  2. createResource( search(), fetcher ) se ejecuta
  3. Fetcher llama resolveMcpToolIDs():
     a. status = sdk.client.mcp.status()     → HTTP al servidor (worker)
     b. ids    = sdk.client.tool.ids()       → HTTP al servidor (worker)
     c. prefixes = keys(status) sanitizados + "_"
     d. fromStatus = ids.filter(id => id.startsWith(algún prefix))  ← siempre []
     e. fromRegistry = Object.keys(MCP.tools())  ← llamado en proceso TUI (main)
     f. merged = [...fromStatus, ...fromRegistry]
  4. Si merged.length === 0 → se muestran "No MCP tools loaded" y "Run /mcp-tools --debug"
  5. Si merged.length > 0 → se muestran los IDs como opciones
```

**Archivos clave:**

| Archivo | Rol |
|--------|-----|
| `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx` | `resolveMcpToolIDs`, resource `[tools]`, opciones cuando `toolsQuery` |
| `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` | Slash "mcp-tools", `loadMcpToolIDs`, submit de `/mcp-tools` |
| `packages/opencode/src/server/routes/experimental.ts` | GET `/experimental/tool/ids` → `ToolRegistry.ids()` |
| `packages/opencode/src/tool/registry.ts` | `ToolRegistry.ids()`: solo built-in + custom + plugin |
| `packages/opencode/src/mcp/index.ts` | `MCP.tools()`: clientes MCP en el proceso actual |

---

## 3. Causa raíz

### 3.1 La API `tool.ids` no incluye herramientas MCP

- **Dónde:** El endpoint `GET /experimental/tool/ids` devuelve `ToolRegistry.ids()`.
- **Qué hace ToolRegistry.ids():** Devuelve IDs de herramientas built-in (bash, read, edit, …), custom (tool/*.ts) y de plugins. **No integra en ningún sitio las herramientas MCP.**
- **Consecuencia:** En el TUI, `sdk.client.tool.ids()` nunca devuelve IDs MCP. La rama `fromStatus` en `resolveMcpToolIDs` siempre queda vacía.

```ts
// experimental.ts
return c.json(await ToolRegistry.ids())

// registry.ts — all() no incluye MCP
return [InvalidTool, QuestionTool, BashTool, ReadTool, ...custom]
```

### 3.2 La lista depende solo de MCP.tools() en el proceso del TUI

- **Dónde:** En `autocomplete.tsx`, `fromRegistry = Object.keys(await MCP.tools())` se ejecuta en el **proceso principal** (donde corre el TUI).
- **Arquitectura:** El servidor HTTP y los clientes MCP viven en un **Worker**; el TUI corre en el proceso main. Cada proceso tiene su propio estado (Instance, Config, MCP).
- **Consecuencia:** Si en el proceso main no hay clientes MCP conectados (config distinta, inicialización más lenta, o MCP solo inicializado en el worker), `MCP.tools()` devuelve `{}` y la lista queda vacía o en el estado "No MCP tools loaded".

---

## 4. Posibles soluciones

### Opción A: Exponer IDs de herramientas MCP por API (recomendada)

**Idea:** El servidor (worker) ya tiene los clientes MCP y puede obtener los IDs. Añadir un endpoint que devuelva solo IDs MCP (o extender uno existente) y que el TUI use solo la API.

**Cambios:**

1. **Backend**
   - Añadir endpoint, por ejemplo `GET /experimental/tool/mcp-ids` (o `GET /mcp/tools/ids`) que devuelva `Object.keys(await MCP.tools())` en el proceso del servidor.
   - Opcional: mantener contrato tipo `{ ids: string[] }` para futuras extensiones.

2. **TUI (autocomplete)**
   - En `resolveMcpToolIDs`: si el SDK expone el nuevo método (p. ej. `sdk.client.experimental.tool.mcpIds()` o `sdk.client.mcp.toolIds()`), llamarlo y usar ese array como fuente principal de IDs MCP.
   - Mantener `MCP.tools()` como fallback solo cuando la URL sea “local” (mismo proceso) si se desea compatibilidad con `opencode attach` o flujos sin worker.

**Ventajas:** Una sola fuente de verdad (servidor); mismo comportamiento con worker y sin worker si se usa la API; no duplica conexiones MCP.  
**Desventajas:** Requiere definir y mantener el endpoint y regenerar/actualizar el cliente SDK (OpenAPI).

---

### Opción B: Incluir IDs MCP en ToolRegistry / en la respuesta de tool.ids

**Idea:** Hacer que `ToolRegistry.ids()` (o el handler de `GET /experimental/tool/ids`) incluya también los IDs devueltos por `MCP.tools()` en el proceso del servidor.

**Cambios:**

1. **Backend**
   - En el handler de `GET /experimental/tool/ids`, algo como:  
     `const registryIds = await ToolRegistry.ids()`  
     `const mcpIds = Object.keys(await MCP.tools())`  
     `return c.json([...registryIds, ...mcpIds])`  
   - O extender ToolRegistry para que “registre” también IDs MCP (solo IDs, sin implementación) cuando se construye el estado del servidor.

**Ventajas:** El TUI no cambia de API (sigue usando `tool.ids()`); la rama `fromStatus` empezaría a recibir IDs MCP (si el prefijo por servidor coincide).  
**Desventajas:** Mezcla semántica (tool.ids pasa a ser “todos los IDs”, no solo registry); posibles duplicados o necesidad de marcar origen (nativo vs MCP) si más adelante se necesita.

---

### Opción C: Asegurar que el proceso main tenga clientes MCP como el worker

**Idea:** Que el proceso del TUI inicialice MCP igual que el worker (misma config, mismo directorio) para que `MCP.tools()` en main devuelva los mismos IDs.

**Cambios:**

1. Garantizar que antes de abrir el autocomplete, el main haya llamado algo que inicialice `MCP.state()` (p. ej. precalentar con `Instance.provide` + una llamada a `MCP.tools()` o `MCP.status()`).
2. Revisar que Config y Instance en main tengan el mismo `directory` (y config files) que en el worker.

**Ventajas:** No hace falta tocar API ni OpenAPI.  
**Desventajas:** Duplicación de conexiones MCP (main + worker); dos fuentes de verdad; más frágil ante diferencias de entorno entre procesos; no ayuda cuando el TUI se conecta a un servidor remoto (attach).

---

## 5. Solución recomendada

**Recomendación: Opción A (nuevo endpoint de IDs MCP).**

- Centraliza la fuente de verdad en el servidor (worker), que es donde ya están los clientes MCP.
- Funciona igual con TUI por worker o por `attach` a un servidor remoto.
- No duplica conexiones MCP ni estado entre procesos.
- Permite más adelante añadir filtros (por servidor, por capacidad, etc.) sin tocar el TUI en exceso.

**Pasos sugeridos:**

1. Añadir en el servidor un endpoint, por ejemplo `GET /experimental/tool/mcp-ids`, que devuelva `Object.keys(await MCP.tools())`.
2. Regenerar el cliente SDK (OpenAPI) para exponer ese método.
3. En `resolveMcpToolIDs` (autocomplete.tsx):
   - Llamar al nuevo método vía SDK y usar ese array como lista principal de IDs MCP.
   - Opcional: mantener `MCP.tools()` como fallback cuando `props.url` sea `http://opencode.internal` (o no se use fetch remoto) para no depender del worker en flujos locales especiales, si los hubiera.
4. Ajustar la lógica de `merged`: por ejemplo `merged = [...new Set([...fromStatus, ...fromApiMcpIds, ...fromRegistry])]` y priorizar `fromApiMcpIds` cuando exista.

---

## 6. Pruebas sugeridas

### 6.1 Pruebas manuales (antes y después del cambio)

1. **Configurar al menos un servidor MCP** (local o remoto) en la config de opencode y asegurarse de que esté `connected` (`opencode mcp list` o equivalente).
2. **Abrir la TUI** (`bun dev` o `opencode` en el directorio del proyecto).
3. **En el área de prompt:**
   - Escribir `/` y comprobar que aparece el comando `mcp-tools` (o `tools`).
   - Seleccionar `mcp-tools` para dejar el texto `/mcp-tools `.
4. **Comprobar autocomplete:**
   - **Antes del fix:** No se listan tools MCP (o solo "No MCP tools loaded" y "Run /mcp-tools --debug").
   - **Después del fix:** Debe mostrarse la lista de IDs MCP (p. ej. `server_name_tool_name`) y poder elegir uno para completar `/mcp-tools <id> `.
5. **Comprobar submit:** Escribir `/mcp-tools <tool_id> <objetivo>` y enviar; debe aceptarse y usarse la tool MCP (o mostrar error coherente si la tool no existe).
6. **Modo debug:** Ejecutar `/mcp-tools --debug` y comprobar que los números de "tools loaded" y "fromStatusCount / fromRegistryCount" tienen sentido (tras el fix, fromStatus o el nuevo endpoint deberían aportar IDs).

### 6.2 Pruebas automatizadas (ideas)

- **API:** Test de integración o e2e que, con un mock o servidor MCP de prueba, llame a `GET /experimental/tool/mcp-ids` (o el path elegido) y compruebe que la respuesta es un array de strings y que contiene al menos los IDs del servidor de prueba.
- **TUI/autocomplete:** Si existe stack de tests para el TUI (p. ej. con el worker mockeado), simular respuesta del nuevo endpoint con una lista fija de IDs y comprobar que las opciones del autocomplete en modo `/mcp-tools` incluyen esos IDs.
- **Regresión:** Test que verifique que `GET /experimental/tool/ids` sigue devolviendo los IDs del ToolRegistry (built-in + custom/plugin) y que no se rompe ningún consumidor actual de esa ruta.

### 6.3 Casos a tener en cuenta

- **Sin servidores MCP configurados:** Debe mostrarse el estado actual ("No MCP tools loaded", configured=0, connected=0) y la opción de debug.
- **Servidor MCP configurado pero no conectado:** Lista puede estar vacía hasta que el servidor esté `connected`; el mensaje de debug debe reflejarlo.
- **TUI conectada por `attach` a otro host:** La lista debe venir del servidor al que se hace attach (nuevo endpoint en ese servidor), no del proceso local.

---

## 7. Referencias

- Análisis previo en conversación (agentes de exploración y revisión de código).
- `documentacion-local/plan-distribuido-4-agentes/17-MCP-TOOLS-DEBUG-HANDOFF.md` — historial de cambios y debug de `/mcp-tools`.
- `documentacion-local/07-package-opencode-code-map.md` — mapa del paquete opencode (TUI, server, MCP).
- Código: `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx` (líneas ~96–112, 406–459), `packages/opencode/src/server/routes/experimental.ts`, `packages/opencode/src/tool/registry.ts`, `packages/opencode/src/mcp/index.ts` (`MCP.tools()` ~396–428).
