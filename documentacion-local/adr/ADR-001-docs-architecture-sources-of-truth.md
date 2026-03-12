# ADR-001: Fuentes de verdad para arquitectura y docs

- Status: proposed
- Date: 2026-03-11
- Owners: local-analysis

## Context

El repo contiene una superficie documental fuerte en `packages/web/src/content/docs`, documentos raiz (`README.md`, `CONTRIBUTING.md`) y otra posible superficie en `packages/docs`.

Actualmente no existe una declaracion simple de fuente canonica para:

- arquitectura tecnica,
- contratos API,
- y ownership de modulos.

## Decision

1. Tratar como fuentes canonicas iniciales:
   - `packages/web/src/content/docs` para documentacion de usuario y features.
   - raiz (`README.md`, `CONTRIBUTING.md`, `AGENTS.md`) para contribucion y normas.
   - `packages/opencode/src/server/server.ts` + `/doc` + `packages/sdk/openapi.json` para contrato API.
2. Mantener `documentacion-local/` como espacio de trabajo de analisis, no como docs publicas.
3. Catalogar `packages/docs` como pendiente de validacion (activo o legacy).

## Consequences

- Positivas: menos ambiguedad para contributors; mejor trazabilidad entre codigo y docs.
- Negativas: requiere mantenimiento adicional al inicio.
- Tradeoff: una sola fuente canonica reduce flexibilidad, pero mejora coherencia.

## Alternatives considered

1. Tratar ambos (`packages/web` y `packages/docs`) como equivalentes: descartado por confusion.
2. Migrar todo de una vez: descartado por riesgo y volumen.
3. No decidir: descartado por deuda creciente.

## References

- `packages/web/src/content/docs`
- `README.md`
- `CONTRIBUTING.md`
- `packages/opencode/src/server/server.ts`
- `packages/sdk/openapi.json`
