# MCP-SERVER: tools y cómo se exponen

**Proyecto:** `C:\PROYECTOS\MCP-SERVER`  
**Fecha:** 2025-03-12  
**Origen:** Revisión por 4 agentes (estructura, definición/registro de tools, protocolo/HTTP, catálogo y descubrimiento).

Este documento resume cómo está organizado el proyecto MCP-SERVER y cómo se definen, registran y exponen las tools MCP. Sirve como referencia al integrar OpenCode con este servidor o al comparar patrones (p. ej. listado de tools en autocomplete).

---

## 1. Estructura del proyecto

| Carpeta | Función |
|--------|---------|
| **gateway/** | Backend principal: API REST (Express), servidor MCP (stdio + HTTP), sesiones MCP, búsqueda (Qdrant), Azure DevOps, DCR/OAuth, explorador de archivos, subida de KB/inbox. Es el “MCP Knowledge Hub Gateway”. |
| **webapp/** | Frontend Next.js: UI para archivos, Azure Tasks/Changesets, **catálogo de tools MCP** en la ruta `/mcp-tools`. Consume la API del gateway. |
| **extensiones_magaya/** | Proyecto aparte: extensión Node que expone APIs REST para Hyperion (Magaya). **No es MCP**; no referencia tools ni el gateway. |

**Arranque:**

- **Gateway (MCP por HTTP):** `cd gateway && npm run build && npm start` → puerto **3001**. Expone `POST /mcp` (JWT), `GET/DELETE /mcp`, y **GET /mcp/tools**, **GET /mcp/tools/:name** (catálogo público).
- **Servidor MCP stdio (IDE):** `npm run mcp` → `node dist/mcp-server.js`; mismo `McpServer` que en HTTP, con `StdioServerTransport`.
- **Webapp:** `cd webapp && npm run dev` (o build + start).

**Referencias:** `gateway/src/index.ts`, `gateway/src/mcp-server.ts`, `gateway/package.json`, `webapp/package.json`.

---

## 2. Definición y registro de tools

### 2.1 Catálogo (solo documentación)

- **Archivo:** `gateway/src/mcp/tools-catalog.ts`
- **Qué hace:** Define la lista “amigable” de tools: nombre, descripción, argumentos (nombre, tipo, required, description, enum), ejemplos, notas. No ejecuta nada.
- **Estructura:** `ToolCatalogEntry` (name, description, args?, examples?, notes?), array `MCP_TOOLS_CATALOG`.
- **Uso:** La tool MCP `list_tools` y los endpoints REST GET `/mcp/tools` y GET `/mcp/tools/:name` consumen este catálogo.
- **Funciones exportadas:** `getMcpToolsCatalog()`, `getMcpToolByName(name)`.

### 2.2 Lógica por tool (módulos)

Cada tool tiene la lógica en un módulo; el **nombre MCP, schema y handler** se registran en un solo lugar: `mcp-server.ts`.

| Ubicación | Ejemplos | Patrón |
|-----------|----------|--------|
| **gateway/src/tools/** | `read-file-region.ts`, `grep-code.ts`, `grep-symbols.ts` | Interfaces de entrada + función `run*` que devuelve envelope (summary_text, data, meta). |
| **gateway/src/** | `tree-sitter-tool.ts`, `semgrep-tool.ts`, `search.ts`, `url-indexer.ts`, `shared-dirs.ts`, `user-kb.ts`, `flow-doc.ts`, `repo-git.ts`, `github-search.ts`, `code-chunking.ts`, etc. | Exportan función de ejecución (p. ej. `parseFileWithTreeSitter`, `runSemgrepScan`, `searchDocs`). |
| **gateway/src/azure/** | Work items, changesets, TFVC, etc. | Cliente Azure + handlers. |
| **gateway/src/clickup-client.ts** | Tools ClickUp | Idem. |

Las tools no se “registran” en estos archivos; solo exportan la lógica. El registro es siempre en `mcp-server.ts`.

### 2.3 Registro en el servidor MCP (único lugar)

- **Archivo:** `gateway/src/mcp-server.ts`
- **Función:** `buildMcpServer(ctx)` crea `new McpServer(...)` y registra cada tool con:

```ts
mcpServer.tool(
  'nombre_tool',           // nombre MCP
  'Descripción...',       // descripción para el modelo
  { param1: z.string(), param2: z.number().optional(), ... },  // schema Zod
  async (args) => { ... return { content: [{ type: 'text', text }] }; }  // handler
);
```

- **Tool `list_tools`:** Es una tool más; su handler llama a `getMcpToolsCatalog()` y devuelve markdown con la lista. No viene del SDK.
- **Respuesta estándar:** Todas las tools devuelven `{ content: [{ type: 'text', text: string }] }` (a veces texto + delimitador + JSON).

**Lista de tools (ejemplos):** `search_docs`, `count_docs`, `read_file_region`, `grep_code`, `grep_symbols`, `tree_sitter_parse`, `semgrep_scan`, `list_tools`, indexación de URLs, Azure DevOps, ClickUp, Git, shared dirs, User KB, etc. Todas documentadas en `tools-catalog.ts` y registradas en `mcp-server.ts`.

---

## 3. Exposición: protocolo MCP y HTTP

### 3.1 Protocolo MCP (JSON-RPC)

- **SDK:** `@modelcontextprotocol/sdk` (McpServer, StdioServerTransport, etc.).
- **Métodos expuestos:** `tools/list` (lista de tools con nombre, descripción, inputSchema) y `tools/call` (ejecución). El SDK traduce los schemas Zod al JSON Schema del protocolo.

**Transportes:**

- **stdio:** `mcp-server.ts` usa `StdioServerTransport()`; el cliente (p. ej. Cursor) lanza el proceso y habla por stdin/stdout.
- **HTTP:** En `gateway/src/index.ts`, las peticiones MCP van a **POST /mcp** (JWT, header `mcp-session-id`). El gateway usa `session-manager.ts` y `http-streamable-transport.ts`: un POST = un mensaje JSON-RPC; la respuesta va en el cuerpo. Cada sesión tiene su `McpServer` (mismo `buildMcpServer`).

### 3.2 Endpoints REST (catálogo, públicos)

| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/mcp/tools` | `{ count, tools }` — array de `ToolCatalogEntry` (nombre, descripción, args, examples, notes). Sin auth. |
| GET | `/mcp/tools/:name` | Una entrada del catálogo o 404. |

Definidos en `gateway/src/index.ts` (aprox. líneas 1000–1015), con `getMcpToolsCatalog()` y `getMcpToolByName()`.

La REST **no** devuelve el mismo `inputSchema` que el protocolo MCP; devuelve el formato del catálogo (args con tipo/required/description, ejemplos).

---

## 4. Catálogo, listado y descubrimiento

### 4.1 Fuente única del catálogo

- **`gateway/src/mcp/tools-catalog.ts`** es la fuente para la lista “humana” (nombre, descripción, args, ejemplos).
- **Tool `list_tools`:** Devuelve markdown generado a partir del catálogo.
- **REST:** GET `/mcp/tools` y GET `/mcp/tools/:name` sirven ese mismo catálogo.

### 4.2 Webapp

- **Página:** `webapp/src/app/mcp-tools/page.tsx` (ruta `/mcp-tools`).
- **Datos:** `fetch` a `/api/mcp/tools` (proxy en Next a gateway `/mcp/tools`).
- **UI:** Lista de tools con filtro, agrupación por categoría (Azure, ClickUp, Indexing, Instance, Git, Shared, URLs, Docs, Other), panel de detalle con argumentos, ejemplos y notas.

### 4.3 Cómo un cliente obtiene la lista y los schemas

| Cliente | Cómo |
|---------|------|
| **Cliente MCP (IDE, OpenCode)** | Conectar por stdio o **POST /mcp** y enviar **`tools/list`**. La respuesta la genera el SDK: nombre, descripción e **inputSchema** (JSON Schema). |
| **Solo documentación / UI** | **GET /mcp/tools** (y GET `/mcp/tools/:name`). Formato del catálogo, sin el inputSchema del protocolo. |

### 4.4 Documentación en el repo MCP-SERVER

- `docs/MCP-ENDPOINTS-Y-COMUNICACION.md` — Endpoints GET `/mcp/tools`, POST `/mcp`, JSON-RPC.
- `gateway/docs/tools/README.md` — Tabla de herramientas alineada con el servidor.
- `gateway/docs/HTTP-MCP-CURSOR.md`, `docs/MCP-SSE-CLIENTE-Y-N8N.md`, `docs/TESTEAR-MCP-HTTP-STREAMABLE.md` — Ejemplos con `tools/list` y transporte.

---

## 5. Relación con OpenCode

- **OpenCode** es **cliente MCP**: usa `MCP.tools()` y `client.listTools()` / `client.callTool()` contra servidores MCP (como este).
- El diagnóstico en **`10-mcp-tools-autocomplete-diagnosis.md`** explica por qué en OpenCode el autocomplete de `/mcp-tools` no lista tools: la API `tool.ids` no incluye MCP y la lista depende de `MCP.tools()` en el proceso del TUI. Una solución propuesta es exponer los IDs de tools MCP desde el servidor (OpenCode) por API.
- En **MCP-SERVER** las tools sí se exponen de forma clara: por protocolo (`tools/list` con inputSchema) y por REST (GET `/mcp/tools` para catálogo/documentación). Un cliente como OpenCode, al conectarse a este servidor por MCP, obtendría la lista vía `tools/list`; el problema del autocomplete está en el lado OpenCode (qué fuente usa para rellenar la lista en la TUI).

---

## 6. Referencias rápidas

| Tema | Archivo(s) |
|------|------------|
| Entrada HTTP y rutas | `gateway/src/index.ts` |
| Servidor MCP y registro de tools | `gateway/src/mcp-server.ts` |
| Catálogo de tools | `gateway/src/mcp/tools-catalog.ts` |
| Sesiones MCP HTTP | `gateway/src/mcp/session-manager.ts`, `session-queue.ts`, `http-streamable-transport.ts` |
| Lógica de tools (ejemplos) | `gateway/src/tools/read-file-region.ts`, `grep-code.ts`, `grep-symbols.ts`, `tree-sitter-tool.ts`, `semgrep-tool.ts` |
| Webapp catálogo | `webapp/src/app/mcp-tools/page.tsx` |
