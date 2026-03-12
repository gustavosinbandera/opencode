# Migration plan (docs)

## Objetivo

Reducir deuda de documentacion sin frenar desarrollo.

## Fase 1: baseline

- Publicar mapa tecnico base (`01`, `02`, `03`).
- Acordar fuentes canonicas (ADR-001).
- Identificar README boilerplate en paquetes core.

## Fase 2: paquete por paquete

- Actualizar README de `packages/opencode`.
- Actualizar README de `packages/app`.
- Actualizar README de `packages/desktop`.
- Actualizar README de `packages/sdk/js`.

Cada README debe incluir:

- responsabilidad,
- entrypoints,
- comandos de desarrollo,
- contrato con otros paquetes.

## Fase 3: sincronizacion con docs publicas

- Reflejar mapa de arquitectura en `packages/web/src/content/docs`.
- Agregar guia corta de impacto para cambios API/SDK.
- Revisar estado de `packages/docs` (migrar, consolidar o deprecar).

## Fase 4: control continuo

- Checklist en PR para cambios de API (SDK regen + doc link).
- Revision trimestral de docs desactualizadas.
- Al menos un ADR por cambio estructural importante.
