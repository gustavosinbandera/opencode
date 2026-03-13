# Agente 5 - MCP Tools DX and Help Quality

## Role type

Product/UX technical specialist for tool discoverability and help quality.

## Mission

Guarantee the product behavior for tool discovery and explicit invocation is consistent, navigable, and fully documented in English.

## Required product behavior

1. `/tools` opens a navigable menu with available tools (native behavior style).
2. Selecting one tool inserts `/tool <selected_tool> ` into the prompt input.
3. User can continue typing objective text after selection.
4. `/tool <selected_tool> --help` returns tool help when available.
5. If tool help is missing, return a safe fallback help response.
6. All tool descriptions and help text must be in English.

## Scope

- Slash parser and popover/menu behavior for `/tools` and `/tool`.
- Tool metadata quality: name, description, argument hints, help availability.
- Fallback UX for tools without explicit help.
- Consistency checks between CLI/TUI and app behavior.

## Deliverables

1. Current-state audit for `/tools` and `/tool` behavior.
2. Gap report for MCP tools missing help/description.
3. Standard help contract proposal (`summary`, `arguments`, `examples`, `notes`).
4. Prioritized backlog for help coverage and UX polish.

## Acceptance criteria

- `/tools` menu is discoverable and keyboard-navigable.
- `/tool <name> --help` path is deterministic.
- Missing-help fallback is explicit and actionable.
- User-facing tool text is English-only.

## Do not

- Do not change tool semantics while auditing help/description quality.
- Do not add multilingual output in tool help for MVP.
