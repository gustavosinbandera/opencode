# Spec - `/tools` and `/tool` UX

## Goal

Define exact behavior for tool discovery and explicit tool execution in a way that matches native OpenCode interaction patterns.

## Commands

- `/tools`
  - Opens a navigable tool list menu.
  - Menu includes: tool name, short description, source, risk badge.
- `/tool <tool_name> <objective>`
  - Executes explicit tool intent.
- `/tool <tool_name> --help`
  - Shows help for the selected tool.

## Interaction flow

1. User types `/tools`.
2. Popover opens with available tools.
3. User navigates with keyboard arrows and confirms selection.
4. Input is transformed to `/tool <selected_tool> `.
5. User adds objective text and submits.

## Help behavior

- Preferred path: use explicit tool help metadata if provided.
- Fallback path (required): generate structured help from tool schema.

Fallback response format:

- `Tool`: `<name>`
- `Description`: `<description or fallback text>`
- `Arguments`: `<schema-driven list>`
- `Example`: `/tool <name> <objective>`
- `Notes`: `No dedicated --help provided by this tool; showing inferred help.`

## Error behavior

- Unknown tool: clear error + top suggestions.
- Missing permission: deny message + required permission.
- Timeout/dependency failure: recoverable error + retry guidance.

## Content quality

- All user-facing descriptions and help text in English.
- Avoid ambiguous wording and internal jargon.

## Acceptance checks

1. `/tools` opens and is keyboard navigable.
2. Selecting menu item produces `/tool <name> `.
3. `/tool <name> --help` works with explicit help.
4. `/tool <name> --help` works with fallback help when explicit help is missing.
5. All shown descriptions/help are English.
