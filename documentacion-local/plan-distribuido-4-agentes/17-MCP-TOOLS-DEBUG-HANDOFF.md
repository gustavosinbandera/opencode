# MCP Tools Debug Handoff

## Context

This document captures the MCP tools debugging work performed in the local OpenCode CLI/TUI flow and the unresolved user-facing issue.

## Reported issue

- User expectation: type `/tools` and see available MCP tools in CLI, selectable without memorizing names.
- Observed behavior in user screenshots:
  - `No matching items`
  - fallback row `No MCP tools loaded configured=2 connected=2`
  - no actionable MCP tool list rendered.

## What was attempted

### 1) Added explicit MCP list flow in TUI autocomplete

- Introduced MCP-aware suggestions for slash-based tool discovery.
- Changed rendering to show plain tool IDs only (no inline markdown-heavy descriptions).

### 2) Multiple MCP data-source strategies

- MCP registry source: `MCP.tools()`
- SDK status source: `sdk.client.mcp.status()`
- SDK IDs source: `sdk.client.tool.ids()`
- Added fallback/merge strategies across those sources.

### 3) Command split to reduce ambiguity

- Kept `/tool` for native tools.
- Added dedicated MCP path `/mcp-tools` for MCP tools.
- Later added `/tools` alias for `/mcp-tools` to preserve compatibility.

### 4) Temporary diagnostics

- Added debug output on `/mcp-tools --debug`.
- Added fallback rows in autocomplete to avoid silent empty state.

## Relevant commits (chronological, newest first)

- `e66040f14` fix(tui): add /tools alias for /mcp-tools and unify MCP autocomplete handling
- `55d68601b` fix(tui): merge MCP registry with status-filtered ids to prevent empty mcp-tools list
- `d8e608c2c` fix(tui): resolve MCP tools from live SDK status/ids and keep /mcp-tools diagnostics actionable
- `997d741bc` fix(tui): show MCP debug fallback entries instead of empty /mcp-tools autocomplete
- `85080cca5` chore(tui): add temporary MCP tool diagnostics output for /mcp-tools command debugging
- `9c2d92bcf` fix(tui): separate native /tool from MCP-only /mcp-tools autocomplete flow
- `8ab56df65` fix(tui): add explicit mcp/native /tool scopes to avoid ambiguity between MCP and native tools
- `31f744681` fix(tui): restore /tool slash entry and keep explicit tool execution compatible with native tools
- `60dcfa594` fix(tui): use inline /tools MCP list instead of dialog search and scope results to local MCP server
- `2698e2365` fix(tui): auto-open MCP tools dialog when user types /tools directly
- `8c0910b54` feat(tui): open dedicated MCP tool picker for /tools with reconnect-aware loading
- `5ee9f9b5e` fix(tui): make /tools resilient by combining MCP registry, prefix-filtered ids, and reconnect attempts
- `952affcbb` fix(tui): keep /tools populated via cached MCP ids and reconnect retry logic
- `e10503718` fix(tui): fallback MCP tool discovery to status-derived prefixes when registry is temporarily empty
- `d90aebeb9` fix(tui): source /tools and /tool validation from live MCP tool registry
- `5013c0d55` fix(tui): restrict /tools picker to MCP-derived tool ids only
- `1d9bba50f` refactor(tui): simplify /tools picker to show plain tool ids without inline descriptions
- `1b302b1a6` fix(tui): reopen slash picker as tool menu after selecting /tools

## Current unresolved state

- User still reports that expected MCP tools are not displayed in CLI autocomplete flow.
- Debug fallback indicates MCP servers may be connected but tool list resolution is still inconsistent in TUI runtime.

## Suggested next-step for handoff agent

1. Add a deterministic, single source of truth for MCP tools in TUI (avoid mixed source logic).
2. Add a visible in-UI counter near prompt (`mcp tools: N`) fed by the same source used by autocomplete.
3. Write an integration test for slash autocomplete with mocked MCP status + tools payload.
4. Remove temporary debug/fallback code only after stable behavior is confirmed.

## Notes

- The user explicitly requested to stop investing time on this thread and continue with another agent.
- This handoff doc is intended to preserve full context and prevent repeated trial-and-error.
