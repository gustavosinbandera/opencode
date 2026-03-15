# Built-in Formatting Tools

OpenCode includes three custom built-in tools designed to render structured content directly inline in the terminal. These tools are enforced via the system prompt so that the LLM agent uses them automatically in every session.

---

## Architecture Overview

The tool enforcement system works at three levels:

1. **System prompt injection** (`src/session/system.ts`): The `<formatting-tools>` block is appended to the environment section of the system prompt. This instructs the LLM to always prefer the built-in tools over manual text formatting.

2. **Tool descriptions** (`src/tool/diagram.ts`, `src/tool/table.ts`, `src/tool/github.ts`): Each tool description starts with "PREFERRED tool" and includes explicit instructions like "NEVER draw tables manually" to reinforce tool selection.

3. **Tool registry** (`src/tool/registry.ts`): All three tools are registered alongside core tools (bash, read, write, etc.) so they are available in every session.

### System Prompt Integration

In `src/session/system.ts`, the `environment()` function appends a `<formatting-tools>` block:

```typescript
`<formatting-tools>`,
`You have built-in formatting tools. ALWAYS use them instead of manual text formatting:`,
`- "diagram" tool: Use for ANY flow diagram, architecture, pipeline, or system visualization.`,
`- "table" tool: Use for ANY tabular data, comparisons, feature matrices, or structured lists.`,
`- "github" tool: Use for ALL GitHub operations (repos, issues, PRs, tree, releases, actions, code search).`,
`</formatting-tools>`,
```

This ensures every new session receives the instructions regardless of conversation history.

---

## Tool: `diagram`

**Purpose**: Render ASCII flow diagrams using unicode box-drawing characters inline in the terminal.

**Source**: `src/tool/diagram.ts` + `src/util/ascii-diagram.ts`

### When to use

- User asks to draw, visualize, diagram, or sketch any architecture
- User asks for a flow diagram, pipeline, or system of connected components
- User asks for a visual representation of how components connect

### When NOT to use

- User explicitly asks for a PNG/image file (use MCP diagram tools instead)
- The content is tabular data (use `table` tool instead)

### Parameters

| Parameter   | Type                | Required | Description                                     |
|-------------|---------------------|----------|-------------------------------------------------|
| `title`     | `string`            | No       | Title displayed above the diagram               |
| `nodes`     | `string[]`          | Yes      | Array of node labels (box names)                |
| `edges`     | `[number, number, string?][]` | Yes | Connections as `[fromIndex, toIndex, label?]` |
| `direction` | `"LR"` or `"TB"`   | No       | Flow direction (default: `"LR"`)                |

### Example

```json
{
  "title": "Serverless Architecture",
  "nodes": ["Client", "API Gateway", "Lambda", "DynamoDB"],
  "edges": [[0, 1, "HTTPS"], [1, 2, "invoke"], [2, 3, "query"]],
  "direction": "LR"
}
```

**Output:**
```
Serverless Architecture
──────────────────────

┌────────┐          ┌─────────────┐           ┌────────┐          ┌──────────┐
│ Client │─ HTTPS ─▶│ API Gateway │─ invoke ─▶│ Lambda │─ query ─▶│ DynamoDB │
└────────┘          └─────────────┘           └────────┘          └──────────┘
```

### TUI Rendering

The `DiagramView` component in `src/cli/cmd/tui/routes/session/index.tsx` renders diagram output without a surrounding box frame, using the theme's text color. The diagram's own box-drawing characters (┌─┐│└─┘) serve as the visual structure.

### Slash Command

Available as `/diagram` (aliases: `/draw`, `/flow`). Inserts a prefilled prompt for the user to describe what to draw.

---

## Tool: `table`

**Purpose**: Render perfectly aligned ASCII tables using unicode box-drawing characters inline in the terminal.

**Source**: `src/tool/table.ts` + `src/util/ascii-diagram.ts` (`asciiTable` function)

### When to use

- User asks for a table, comparison, matrix, or structured list
- User asks to compare features, products, models, etc.
- Any time data should be presented in rows and columns
- The LLM would otherwise draw a table manually in text (which causes alignment issues)

### When NOT to use

- The content is a flow/architecture diagram (use `diagram` tool instead)
- The content is plain narrative text

### Parameters

| Parameter | Type                           | Required | Description                              |
|-----------|--------------------------------|----------|------------------------------------------|
| `title`   | `string`                       | No       | Title displayed above the table          |
| `headers` | `string[]`                     | Yes      | Column header labels                     |
| `rows`    | `string[][]`                   | Yes      | Array of rows, each row is array of cells|
| `align`   | `("left"\|"right"\|"center")[]`| No       | Per-column alignment (default: `"left"`) |

### Example

```json
{
  "title": "Model Comparison",
  "headers": ["Model", "Speed", "Cost", "Quality"],
  "rows": [
    ["GPT-4o", "Fast", "$$", "Excellent"],
    ["Claude 3.5", "Medium", "$", "Excellent"],
    ["Llama 3", "Varies", "Free", "Good"]
  ],
  "align": ["left", "center", "center", "center"]
}
```

**Output:**
```
Model Comparison
────────────────

┌─────────────┬────────┬──────┬───────────┐
│ Model       │ Speed  │ Cost │  Quality  │
├─────────────┼────────┼──────┼───────────┤
│ GPT-4o      │  Fast  │  $$  │ Excellent │
│ Claude 3.5  │ Medium │  $   │ Excellent │
│ Llama 3     │ Varies │ Free │   Good    │
└─────────────┴────────┴──────┴───────────┘
```

### Column auto-sizing

The `asciiTable` function automatically calculates column widths based on the longest content in each column (including headers). This guarantees perfect alignment regardless of content length — the primary reason this tool exists.

### TUI Rendering

The `TableView` component renders table output without a surrounding box frame, using the theme's text color.

---

## Tool: `github`

**Purpose**: Interact with GitHub repositories, issues, PRs, releases, actions, and code search — rendered inline in the terminal.

**Source**: `src/tool/github.ts` + `src/util/github/*.ts`

**Dependency**: Requires `gh` (GitHub CLI) installed and authenticated.

### When to use

- User asks about GitHub repos, issues, PRs, releases, or CI status
- User asks to browse or explore a repository
- User asks to search for code patterns across repos
- User asks anything that would otherwise require `gh` or `curl` to GitHub API

### When NOT to use

- The user is working with local git operations (use `bash` with `git` commands)
- The user needs to create/modify issues or PRs (use `bash` with `gh` commands for write operations)

### Parameters

| Parameter  | Type     | Required | Description                                           |
|------------|----------|----------|-------------------------------------------------------|
| `action`   | `string` | Yes      | One of the actions listed below                       |
| `repo`     | `string` | Varies   | Repository in `"owner/repo"` format                   |
| `owner`    | `string` | Varies   | GitHub username or organization                       |
| `query`    | `string` | Varies   | Search query (for search actions)                     |
| `state`    | `string` | No       | Filter: `"open"`, `"closed"`, `"all"`                 |
| `language` | `string` | No       | Filter by programming language                        |
| `labels`   | `string` | No       | Filter by labels (for issues)                         |
| `path`     | `string` | No       | Path within repo (for tree action)                    |
| `limit`    | `number` | No       | Max results to return (default: 20)                   |

### Actions

| Action          | Required params | Description                              |
|-----------------|-----------------|------------------------------------------|
| `repos`         | `owner`         | List repositories for a user/org         |
| `view`          | `repo`          | View detailed repo info with README      |
| `issues`        | `repo`          | List issues (filterable by state/labels) |
| `prs`           | `repo`          | List pull requests (filterable by state) |
| `tree`          | `repo`          | Show file tree (default depth: 1)        |
| `releases`      | `repo`          | List releases                            |
| `actions`       | `repo`          | List CI/CD workflow runs                 |
| `search-code`   | `query`         | Search code patterns across GitHub       |
| `search-repos`  | `query`         | Search repositories by keyword           |

### Examples

```json
// List repos
{ "action": "repos", "owner": "facebook" }

// View repo details
{ "action": "view", "repo": "vercel/next.js" }

// List open issues
{ "action": "issues", "repo": "microsoft/vscode", "state": "open", "limit": 10 }

// Show file tree
{ "action": "tree", "repo": "anthropics/claude-code", "path": "src", "limit": 30 }

// Search code
{ "action": "search-code", "query": "createContext", "language": "typescript", "owner": "facebook" }
```

### Utility modules

| Module                       | Functions                        |
|------------------------------|----------------------------------|
| `src/util/github/repos.ts`   | `listRepos()`, `viewRepo()`      |
| `src/util/github/issues.ts`  | `listIssues()`, `listPRs()`      |
| `src/util/github/tree.ts`    | `repoTree()`, `listReleases()`, `listActions()` |
| `src/util/github/search.ts`  | `searchCode()`, `searchRepos()`  |

All utility functions use `execSync` from `child_process` to run `gh` CLI commands, parse JSON output, and format results using `asciiTable` from `src/util/ascii-diagram.ts`.

### TUI Rendering

The `GitHubView` component renders output without a surrounding box frame, using the theme's text color. The pending state shows a  icon with the action name.

### Slash Command

Available as `/github` (aliases: `/gh`, `/repo`). Inserts a prefilled prompt for the user to describe the GitHub operation.

---

## Adding New Formatting Tools

To add a new built-in formatting tool:

1. **Create the utility** in `src/util/` — pure function that generates formatted output
2. **Create the tool** in `src/tool/` using `Tool.define()`:
   - Start the description with "PREFERRED tool for..."
   - Include "NEVER" and "ALWAYS" directives to guide tool selection
   - Define parameters with Zod schemas and `.describe()` for each field
3. **Register the tool** in `src/tool/registry.ts` — import and add to the `all()` array
4. **Add a TUI view component** in `src/cli/cmd/tui/routes/session/index.tsx`:
   - Add a `<Match when={props.part.tool === "toolname"}>` in the `ToolPart` switch
   - Create a view component (typically without `BlockTool` wrapper for inline rendering)
5. **Update the system prompt** in `src/session/system.ts` — add a line in the `<formatting-tools>` block
6. **(Optional) Add a slash command** — register in the `command.register()` block with `slash: { name: "...", aliases: [...] }`

### Key patterns

- Use `theme.text` for output color (blends with normal content)
- Use `<box paddingLeft={3} marginTop={1} flexShrink={0}>` for the view wrapper
- Use `InlineTool` for the pending/loading state with a descriptive icon
- Tool descriptions with "PREFERRED" and "NEVER/ALWAYS" keywords are critical for LLM tool selection

---

## Theme Integration

The tools use semantic theme properties defined in `src/cli/cmd/tui/context/theme.tsx`:

| Property         | Default      | Used by                                    |
|------------------|--------------|--------------------------------------------|
| `expandCollapse` | `accent`     | "▲ mostrar menos" / "▼ mostrar más" labels |
| `text`           | (foreground) | Diagram, table, and GitHub output           |

These properties can be overridden in any theme JSON file, ensuring tool output blends with the selected theme.
