# Result Agent 5 - MCP Tools DX and Help Quality

## Identification

- Agent: 5
- Role: MCP Tools DX and Help Quality
- Date: 2026-03-12
- Version: v1.0

## Executive summary

- Main finding: current runtime does not implement reserved `/tools` and `/tool <tool> ...` intents.
- Impact: required deterministic UX is currently blocked.
- Confidence: high.

## Evidence-based findings

1. Slash behavior is command-oriented, not tool-intent-oriented.
   - `C:\PROYECTOS\opencode\packages\app\src\components\prompt-input.tsx:550`
   - `C:\PROYECTOS\opencode\packages\app\src\components\prompt-input\submit.ts:268`
2. No reserved `/tools` command currently registered.
   - `C:\PROYECTOS\opencode\packages\app\src\pages\session\use-session-commands.tsx:227`
   - `C:\PROYECTOS\opencode\packages\opencode\src\cli\cmd\tui\component\prompt\autocomplete.tsx:357`
3. No deterministic `/tool <name> --help` branch exists in command execution path.
   - `C:\PROYECTOS\opencode\packages\opencode\src\session\prompt.ts:1752`
   - `C:\PROYECTOS\opencode\packages\opencode\src\session\prompt.ts:1777`
4. Tool contract has no explicit structured help fields.
   - `C:\PROYECTOS\opencode\packages\opencode\src\tool\tool.ts:27`
   - `C:\PROYECTOS\opencode\packages\opencode\src\server\routes\experimental.ts:56`
5. Tool descriptions/help language is not enforced as English in current UX pipeline.
   - `C:\PROYECTOS\opencode\packages\app\src\components\prompt-input\slash-popover.tsx:114`

## Gap vs requested behavior

- `/tools` navigable menu: **not implemented as reserved flow**.
- Select tool -> `/tool <selected_tool> `: **not implemented as reserved flow**.
- `/tool <selected_tool> --help`: **not implemented**.
- Fallback help when missing: **not implemented**.
- English-only tool/help text: **not enforced**.

## Implementation recommendations

1. Add reserved slash intents: `tool_list`, `tool_execute`, `tool_help`.
2. Implement `/tools` popover and selection insertion into input.
3. Implement `/tool <name> --help` resolver.
4. Add structured help metadata fields (`summary`, `arguments`, `examples`, `notes`).
5. Add fallback help synthesis from tool schema when explicit help is absent.
6. Add English-only validation for user-facing tool/help text.

## Non-negotiable validation

- Preserve OpenCode programming guide: yes (analysis-only decisions so far).
- Enterprise MCP integration in plan: yes.
- `/tool <name> <objective>` support: planned, not yet implemented in runtime.
