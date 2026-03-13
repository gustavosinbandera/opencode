# Runbook de Sync Upstream (OpenCode)

Fecha: 2026-03-13
Scope: mantener compatibilidad con `origin/dev` sin perder customizaciones enterprise.

## Modelo de ramas activo

- `upstream/dev`: espejo local de `origin/dev`.
- `integration/upstream-YYYYMMDD`: rama de integracion por ciclo de sync.
- `enterprise/dev`: snapshot estable de customizaciones internas.
- `dev`: rama de trabajo actual.

## Cadencia

- Sync semanal: viernes o antes de desplegar.
- Sync urgente: cuando upstream publica fixes criticos/seguridad.

## Procedimiento estandar

1. Actualizar referencias remotas.
   - `git fetch origin`
2. Refrescar rama espejo upstream.
   - `git branch -f upstream/dev origin/dev`
3. Crear rama de integracion del ciclo.
   - `git branch -f integration/upstream-YYYYMMDD origin/dev`
4. Rebase/cherry-pick de customizaciones por bloques (orden recomendado):
   - `docs`
   - `mcp-tools`
   - `policy`
   - `azure`
5. Validar matriz minima (ver `20-MATRIZ-VALIDACION-SYNC.md`).
6. Merge a rama objetivo (`dev` o `enterprise/dev`) solo si validacion pasa completa.

## Reglas de conflicto

- Preferir cambios en capas compartidas (`permission/next.ts`, `session/prompt.ts`) en lugar de parches ad-hoc en UI.
- Evitar reescribir archivos grandes de TUI si no es imprescindible.
- Resolver conflictos en commits pequenos por dominio, no en un solo mega-merge.

## Convencion de commits de sync

- `chore(sync): refresh upstream/dev baseline`
- `fix(sync): reapply mcp-tools custom layer after upstream merge`
- `feat(policy): enforce strict profile runtime gating`

## Criterio de rollback

- Si falla flujo critico (`/tool`, `/mcp-tools`, Azure evidence), no se promueve el sync.
- Se mantiene `enterprise/dev` como punto de restauracion.
