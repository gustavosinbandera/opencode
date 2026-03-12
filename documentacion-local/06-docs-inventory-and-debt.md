# Docs inventory and debt

## Inventario actual (alto valor)

- Repo onboarding: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`.
- User docs principal: `packages/web/src/content/docs/*.mdx`.
- ACP internals: `packages/opencode/src/acp/README.md`.
- API contract: `packages/sdk/openapi.json` + endpoint `/doc`.

## Inventario con riesgo de confusion

- `packages/docs` parece otra superficie documental separada.
- Varios README de paquetes se ven genericos o incompletos.

## Deuda detectada

- No se encontro corpus ADR consolidado.
- Falta mapa canonico de arquitectura inter-paquetes.
- Falta tabla de ownership de modulos y fronteras de dependencia.
- Falta guia de impacto para cambios en rutas server/OpenAPI.

## Prioridad de remediacion

1. Definir fuente canonica de docs (web docs + root docs).
2. Crear ADR inicial para decision documental.
3. Actualizar README de paquetes core (`opencode`, `app`, `desktop`, `sdk`).
4. Agregar mapa de modulos y contratos en docs oficiales.

## Criterios de done para reducir deuda

- Cada paquete core tiene README con responsabilidad, entrypoint y comandos.
- Existe ADR publicado para arquitectura documental.
- Cambios de API incluyen referencia de regeneracion de SDK.
