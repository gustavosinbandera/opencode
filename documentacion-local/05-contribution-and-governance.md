# Contribution and governance

## Regla corta para contributors

- Abrir issue antes de PR (Issue First Policy).
- Mantener PR chico y enfocado.
- Para cambios de UI, adjuntar evidencia visual.
- Para cambios de logica, documentar como se valido.

Fuente: `CONTRIBUTING.md`.

## Flujo dev recomendado

1. `bun install`
2. `bun dev`
3. Para API headless: `bun dev serve`
4. Para web: `bun run --cwd packages/app dev`
5. Para desktop Tauri: `bun run --cwd packages/desktop tauri dev`

## Reglas tecnicas importantes

- Raiz bloquea tests (`test` en root falla a proposito).
- Ejecutar pruebas desde paquetes concretos.
- Pre-push corre validacion de version Bun y `bun typecheck`.
- Estilo y preferencias de codigo estan en `AGENTS.md`.

## Seguridad y calidad

- Vulnerability reporting via security policy.
- Sistema de confianza via vouch (`.github/VOUCHED.td`).
- Issues fuera de template pueden cerrarse automaticamente.

## Checklist local antes de PR

- Confirmar issue enlazado.
- Confirmar scope minimo de cambios.
- Correr typecheck en paquetes tocados.
- Si cambia API/SDK, ejecutar regeneracion (`./script/generate.ts`).
