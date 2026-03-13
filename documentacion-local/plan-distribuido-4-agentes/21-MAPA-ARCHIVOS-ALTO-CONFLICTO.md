# Mapa de Archivos de Alto Conflicto y Estrategia

Fecha: 2026-03-13

## Archivos de alto conflicto (evitar cambios directos frecuentes)

- `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
  - Motivo: archivo grande con alta rotacion en upstream.
  - Estrategia: minimizar parches; mover reglas a capas compartidas.

- `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx`
  - Motivo: UX de slash y autocompletado cambia seguido.
  - Estrategia: preservar baseline funcional y evitar forks largos.

- `packages/opencode/src/server/server.ts`
  - Motivo: punto de montaje global de rutas.
  - Estrategia: no mezclar logica de negocio; solo wiring.

## Archivos de bajo conflicto (preferidos para extensiones)

- `packages/opencode/src/permission/next.ts`
  - Uso: enforcement y auditoria centralizada de decisiones.

- `packages/opencode/src/session/prompt.ts`
  - Uso: inyectar metadata de intent/profile sin tocar UI.

- `packages/opencode/src/config/config.ts`
  - Uso: schema y defaults de `policy.profile`.

- `packages/opencode/src/policy/engine.ts`
  - Uso: reglas runtime desacopladas y testeables.

## Regla de mantenimiento

Si un cambio puede resolverse en `policy/` + `permission/`, se evita tocar TUI. Solo se toca TUI para necesidades de UX visibles al usuario.
