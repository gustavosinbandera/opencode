# Documentacion local de OpenCode

Este directorio concentra notas tecnicas locales para analizar el repositorio en `C:\PROYECTOS\opencode`.

## Objetivo

- Crear una vista rapida de arquitectura, limites de modulos, y flujo de ejecucion.
- Acelerar onboarding y analisis de cambios sin depender de busquedas largas cada vez.
- Registrar deuda documental detectada en el repo.

## Fuentes base usadas

- `README.md`
- `CONTRIBUTING.md`
- `AGENTS.md`
- `package.json`
- `packages/opencode/src/index.ts`
- `packages/opencode/src/server/server.ts`
- `packages/app/src/entry.tsx`
- `packages/desktop/src-tauri/src/main.rs`

## Mapa de documentos

- `01-system-architecture.md`: vista global del sistema y flujo principal.
- `02-module-boundaries-monorepo.md`: limites de paquetes y ownership funcional.
- `03-api-service-layers.md`: capas del servidor HTTP y rutas.
- `04-integration-surfaces.md`: integraciones externas (ACP, MCP, GitHub, IDE, Slack).
- `05-contribution-and-governance.md`: reglas de contribucion y flujo recomendado.
- `06-docs-inventory-and-debt.md`: inventario de documentacion y brechas.
- `07-package-opencode-code-map.md`: mapa tecnico del paquete core.
- `08-package-app-code-map.md`: mapa tecnico del cliente web.
- `09-package-desktop-code-map.md`: mapa tecnico de shells desktop.
- `10-mcp-tools-autocomplete-diagnosis.md`: diagnostico y solucion propuesta para que /mcp-tools liste herramientas MCP en el autocomplete (causa, analisis, pruebas).
- `11-mcp-server-proyecto-tools-y-exposicion.md`: resumen del proyecto MCP-SERVER (C:\PROYECTOS\MCP-SERVER): estructura, definicion/registro de tools, exposicion por protocolo MCP y REST, catálogo y descubrimiento.
- `plan-distribuido-4-agentes/`: plan de trabajo con roles e instrucciones por agente.
- `adr/ADR-000-template.md`: plantilla de decision record.
- `adr/ADR-001-docs-architecture-sources-of-truth.md`: decision inicial de fuentes de verdad.
- `migration/migration-plan.md`: plan de migracion de docs por fases.

## Convenciones para esta carpeta

- Escribir en formato corto y orientado a accion.
- Referenciar archivos reales del repo para cada afirmacion tecnica.
- Evitar duplicar docs oficiales; aqui se resume y conecta.
