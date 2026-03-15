# Custom Features Guide

This document covers all custom features added to the OpenCode fork beyond the upstream project. These features are designed to maintain upstream compatibility — most live in new files that don't conflict with upstream updates.

---

## Table of Contents

1. [File Explorer Panel](#file-explorer-panel)
2. [Voice Input (STT)](#voice-input-stt)
3. [Built-in Formatting Tools](#built-in-formatting-tools)
4. [GitHub Integration Tool](#github-integration-tool)
5. [Theme Extensions](#theme-extensions)
6. [Keybinds & Slash Commands](#keybinds--slash-commands)
7. [MCP Server Integration](#mcp-server-integration)
8. [Upstream Compatibility](#upstream-compatibility)

---

## File Explorer Panel

**Files:** `src/cli/cmd/tui/routes/session/file-explorer.tsx`

A file tree panel in the sidebar with expand/collapse navigation, file preview, and git diff viewer.

### Features

- **Toggle:** Press `F7` or type `/explorer` (aliases: `/files`, `/tree`)
- **Sidebar mode:** Switches between session info (default) and file explorer
- **Collapsible folders:** Click folders to expand/collapse (▶/▼ indicators)
- **File viewer modal:** Click any file to open a syntax-highlighted preview
- **Git diff tabs:** Compare file against upstream or previous commits
- **Filter input:** Type in the search field to filter visible entries

### File Viewer Modal

When clicking a file, a centered modal dialog opens with:

| Tab | Description |
|-----|-------------|
| **📄 File** | Syntax-highlighted file content using the active theme |
| **± vs Upstream** | Diff against `upstream/dev` (or `origin/main`) — auto-detected |
| **~1** | What changed in the last commit (`HEAD~1..HEAD`) |
| **~2, ~3, ~4** | What changed in the last N commits |

Diff view uses GitHub dark theme colors:
- Added lines: `#1a2e22` background, `#3fb950` text
- Removed lines: `#2d1315` background, `#f85149` text
- Hunk headers: `#1c2333` background, `#6e7681` text

### Implementation Details

- Uses native `readdirSync`/`statSync` (no external dependencies, cross-platform)
- Ignores common directories: `node_modules`, `.git`, `dist`, `build`, etc.
- Folder expand/collapse state stored as a `Set<string>` of expanded paths
- File viewer uses the Dialog system for centering
- Click events: folders use `onMouseDown` (instant), files use `onMouseUp` (prevents dialog close)
- Max 500 entries to prevent blocking on large repos
- Git commands use `stdio: ["pipe", "pipe", "pipe"]` to suppress stderr in the TUI

### Upstream Compatibility

- **New file only** (`file-explorer.tsx`) — no upstream conflicts
- **Minimal changes** to `session/index.tsx`: import + sidebar mode signal + conditional render (~15 lines)
- **Keybind** added to `config.ts`: `explorer_toggle` (1 line)

---

## Voice Input (STT)

**Files:** `src/cli/cmd/tui/voice/index.ts`, `src/cli/cmd/tui/context/voice.tsx`

Real-time voice-to-text input using OpenAI Realtime API with ffmpeg for audio capture.

### Features

- **Toggle:** Press `F5` to start/stop recording
- **VU Meter:** 10-dot audio level indicator next to the model name
- **Voice gate:** Only sends audio above threshold (saves API costs)
- **Periodic commits:** Flushes transcription buffer every 3 seconds
- **Silence detection:** Releases buffer immediately when speech stops
- **Auto language:** Detects language automatically (configurable)
- **Period replacement:** Replaces trailing periods from STT with commas for natural flow

### Configuration

In `~/.config/opencode/tui.json`:

```json
{
  "voice": {
    "provider": "openai",
    "apiKey": "sk-proj-...",
    "language": "auto"
  }
}
```

### Supported Providers

| Provider | Protocol | Model |
|----------|----------|-------|
| OpenAI | WebSocket (Realtime API) | gpt-4o-transcribe |
| Deepgram | WebSocket | nova-2 |
| AssemblyAI | WebSocket | — |
| Groq | HTTP (2s chunks) | whisper-large-v3-turbo |

### Prerequisites

- `ffmpeg` installed and in PATH
- API key for the chosen provider

### Upstream Compatibility

- **New files only** (`voice/index.ts`, `context/voice.tsx`)
- **Minimal changes** to `session/index.tsx` (VoiceProvider wrapper), `config.ts` (keybind), `prompt/index.tsx` (VuMeter component)

---

## Built-in Formatting Tools

**Files:** `src/tool/diagram.ts`, `src/tool/table.ts`, `src/util/ascii-diagram.ts`

See [built-in-tools.md](./built-in-tools.md) for detailed documentation.

### Quick Reference

| Tool | Slash Command | Use Case |
|------|---------------|----------|
| `diagram` | `/diagram`, `/draw`, `/flow` | Flow diagrams with boxes and arrows |
| `table` | — | Perfectly aligned tables |
| `github` | `/github`, `/gh`, `/repo` | GitHub repos, issues, PRs, tree, search |

### System Prompt Enforcement

Instructions are injected into the agent's system prompt (`src/session/system.ts`) so the agent prefers these tools over manual text formatting in every session.

---

## GitHub Integration Tool

**Files:** `src/tool/github.ts`, `src/util/github/*.ts`

### Actions

| Action | Required Params | Description |
|--------|-----------------|-------------|
| `repos` | `owner` | List repositories for a user/org |
| `view` | `repo` | View repo info with README |
| `issues` | `repo` | List issues (filterable by state/labels) |
| `prs` | `repo` | List pull requests |
| `tree` | `repo` | Show file tree (depth 1 default) |
| `releases` | `repo` | List releases |
| `actions` | `repo` | List CI/CD workflow runs |
| `search-code` | `query` | Search code patterns across GitHub |
| `search-repos` | `query` | Search repositories by keyword |

### Upstream Compatibility

- **All new files** — zero conflict risk
- Registered in `src/tool/registry.ts` (1 line addition)

---

## Theme Extensions

**File:** `src/cli/cmd/tui/context/theme.tsx`

Seven semantic theme properties added for UI indicators:

| Property | Default Fallback | Used By |
|----------|-----------------|---------|
| `micActive` | `error` (red) | Mic dot when recording |
| `micInactive` | `textMuted` (gray) | Mic dot when inactive |
| `micLabel` | `success` (green) | "mic" label when active |
| `vuLow` | `success` (green) | VU meter dots 0-4 |
| `vuMid` | `warning` (yellow) | VU meter dots 5-7 |
| `vuHigh` | `error` (red) | VU meter dots 8-9 |
| `expandCollapse` | `accent` (cyan) | "▲ mostrar menos" / "▼ mostrar más" labels |

### How Defaults Work

In `resolveTheme()`, if a theme JSON doesn't define these properties, they fall back to the theme's existing palette colors (error, success, warning, accent). This means all existing themes work without modification.

In `generateSystem()` (for auto-generated themes from terminal colors), the properties map to ANSI colors from the terminal palette.

### Overriding in Theme JSON

Any theme JSON file can override these properties:

```json
{
  "theme": {
    "micActive": "#ff0000",
    "vuLow": "#00ff00",
    "expandCollapse": "#00ffff"
  }
}
```

---

## Keybinds & Slash Commands

### Keybinds (defined in `src/config/config.ts`)

| Key | Action | Description |
|-----|--------|-------------|
| `F5` | `voice_toggle` | Toggle voice input on/off |
| `F6` | `canvas_open` | Open canvas viewer (reserved) |
| `F7` | `explorer_toggle` | Toggle file explorer panel |

### Slash Commands (registered in `session/index.tsx`)

| Command | Aliases | Category | Action |
|---------|---------|----------|--------|
| `/diagram` | `/draw`, `/flow` | Tools | Prefills prompt to describe a diagram |
| `/github` | `/gh`, `/repo` | Tools | Prefills prompt for GitHub operations |
| `/explorer` | `/files`, `/tree` | Session | Toggles file explorer panel |

---

## MCP Server Integration

**Project:** `C:/PROYECTOS/MCP-SERVER/gateway/`

The diagram, table, and github tools are also available in the MCP Knowledge Hub server for use by any MCP client (Cursor, VS Code, etc.).

### Files Added to MCP Server

| File | Description |
|------|-------------|
| `gateway/src/ascii-diagram.ts` | Shared diagram/table renderer |
| `gateway/src/github-tools.ts` | 9 GitHub functions (repos, issues, PRs, tree, search, etc.) |
| `gateway/src/mcp-server.ts` | Tool registrations (diagram, table, github) |
| `gateway/src/mcp/tools-catalog.ts` | Documentation catalog entries |

### Replaced Tools

The unified `github` tool replaces two older tools:
- `search_github_repos` → `github` action `search-repos`
- `repo_git` → `github` actions `status`, `add`, `commit`, `push`, `pull`

---

## Upstream Compatibility

### Strategy

All custom features follow these rules to minimize merge conflicts:

1. **New files preferred** — most features live in completely new files
2. **Minimal changes to shared files** — typically 1-5 lines per file
3. **No modifications to upstream-owned logic** — only additions
4. **Feature flags where possible** — keybinds are optional with defaults

### Files Modified (potential merge points)

| File | Lines Changed | What We Added |
|------|--------------|---------------|
| `session/index.tsx` | ~40 lines | VoiceProvider, CanvasProvider (removed), FileExplorer toggle, tool views, slash commands |
| `config.ts` | 3 lines | `voice_toggle`, `canvas_open`, `explorer_toggle` keybinds |
| `theme.tsx` | ~20 lines | 7 theme properties + fallback defaults in resolveTheme/generateSystem |
| `system.ts` | 6 lines | `<formatting-tools>` block in system prompt |
| `tool/registry.ts` | 4 lines | DiagramTool, TableTool, GitHubTool imports + registration |
| `prompt/index.tsx` | ~30 lines | VuMeter component, tryUseVoice import |
| `autocomplete.tsx` | ~5 lines | queueMicrotask fix for mcp-tools dropdown |

### Files Created (zero conflict risk)

- `routes/session/file-explorer.tsx`
- `context/voice.tsx`, `voice/index.ts`
- `tool/diagram.ts`, `tool/table.ts`, `tool/github.ts`
- `util/ascii-diagram.ts`, `util/github/*.ts`
- `docs/built-in-tools.md`, `docs/custom-features.md`

### Merge Process

```bash
git fetch upstream
git merge remotes/upstream/dev
# Resolve conflicts (typically only in heavily modified files)
# Accept upstream for permission/ and other modules we don't customize
bun turbo typecheck --filter=opencode  # Verify compilation
```
