import { createSignal, createMemo, createResource, For, Show, onMount } from "solid-js"
import { useTheme } from "../../context/theme"
import { useSync } from "@tui/context/sync"
import { Installation } from "@/installation"
import { readdirSync, statSync, existsSync } from "fs"
import pathModule from "path"

interface FileEntry {
  name: string
  type: "dir" | "file"
  depth: number
  path: string
}

const IGNORE = new Set([
  "node_modules", ".git", "dist", "build", ".cache", "__pycache__",
  ".next", "target", "coverage", ".turbo", ".venv", "venv",
  ".idea", ".vscode", "obj", "bin", ".DS_Store",
])

function listDir(dir: string): { dirs: string[]; files: string[] } {
  const dirs: string[] = []
  const files: string[] = []
  try {
    for (const item of readdirSync(dir)) {
      if (item.startsWith(".") && item !== ".env") continue
      if (IGNORE.has(item)) continue
      try {
        const full = pathModule.join(dir, item)
        if (statSync(full).isDirectory()) dirs.push(item)
        else files.push(item)
      } catch {}
    }
  } catch {}
  dirs.sort((a, b) => a.localeCompare(b))
  files.sort((a, b) => a.localeCompare(b))
  return { dirs, files }
}

function scanCollapsed(dir: string): FileEntry[] {
  // Show only root-level items (folders collapsed)
  const { dirs, files } = listDir(dir)
  const entries: FileEntry[] = []
  for (const name of dirs) entries.push({ name, type: "dir", depth: 0, path: name })
  for (const name of files) entries.push({ name, type: "file", depth: 0, path: name })
  return entries
}

function scanExpanded(dir: string, folderName: string, maxDepth = 3): FileEntry[] {
  const folderLower = folderName.toLowerCase()
  const { dirs, files } = listDir(dir)
  const entries: FileEntry[] = []

  for (const name of dirs) {
    entries.push({ name, type: "dir", depth: 0, path: name })
    // Expand folders that match the filter
    if (name.toLowerCase().includes(folderLower)) {
      walkInto(pathModule.join(dir, name), 1, name, maxDepth, entries)
    }
  }
  for (const name of files) {
    entries.push({ name, type: "file", depth: 0, path: name })
  }
  return entries
}

function walkInto(dir: string, depth: number, relPath: string, maxDepth: number, entries: FileEntry[]) {
  if (depth > maxDepth || entries.length > 500) return
  const { dirs, files } = listDir(dir)
  for (const name of dirs) {
    const rel = `${relPath}/${name}`
    entries.push({ name, type: "dir", depth, path: rel })
    walkInto(pathModule.join(dir, name), depth + 1, rel, maxDepth, entries)
  }
  for (const name of files) {
    entries.push({ name, type: "file", depth, path: `${relPath}/${name}` })
  }
}

export function FileExplorer() {
  const { theme } = useTheme()
  const sync = useSync()
  const [filter, setFilter] = createSignal("")
  let inputRef: any

  const realDir = createMemo(() => {
    const dir = sync.data.path.directory || process.cwd()
    return dir.replace(/\\/g, "/")
  })

  const targetDir = createMemo(() => {
    const f = filter().trim()
    if (f && (f.startsWith("/") || f.match(/^[A-Za-z]:/))) {
      const normalized = f.replace(/\\/g, "/")
      if (existsSync(normalized)) return { dir: normalized, filter: "" }
    }
    return { dir: realDir(), filter: f }
  })

  const [entries] = createResource(
    () => targetDir(),
    (opts) => {
      if (opts.filter) return scanExpanded(opts.dir, opts.filter)
      return scanCollapsed(opts.dir)
    },
    { initialValue: [] },
  )

  const dirName = createMemo(() => {
    const d = targetDir().dir
    const parts = d.split("/")
    return parts[parts.length - 1] || d
  })

  const fileCount = createMemo(() => entries().filter((e) => e.type === "file").length)
  const dirCount = createMemo(() => entries().filter((e) => e.type === "dir").length)

  const connector = (entry: FileEntry, index: number, all: FileEntry[]) => {
    let isLast = true
    for (let i = index + 1; i < all.length; i++) {
      if (all[i].depth < entry.depth) break
      if (all[i].depth === entry.depth) {
        isLast = false
        break
      }
    }
    return "  ".repeat(entry.depth) + (isLast ? "└─" : "├─")
  }

  return (
    <box
      backgroundColor={theme.backgroundPanel}
      width={42}
      height="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
    >
      <box flexShrink={0} gap={0} paddingBottom={1}>
        <text fg={theme.text}>
          <b>📁 {dirName()}</b>
        </text>
        <text fg={theme.textMuted}>
          {fileCount()} files · {dirCount()} dirs
        </text>
      </box>

      <box flexShrink={0} paddingBottom={1} onMouseDown={() => inputRef?.focus()}>
        <input
          onInput={(e) => setFilter(e)}
          focusedBackgroundColor={theme.backgroundElement}
          cursorColor={theme.primary}
          focusedTextColor={theme.text}
          textColor={theme.textMuted}
          placeholder="🔍 folder name..."
          ref={(r) => {
            inputRef = r
          }}
        />
      </box>

      <scrollbox
        flexGrow={1}
        verticalScrollbarOptions={{
          trackOptions: {
            backgroundColor: theme.background,
            foregroundColor: theme.borderActive,
          },
        }}
      >
        <box flexShrink={0}>
          <Show when={entries().length === 0}>
            <text fg={theme.textMuted}>
              {entries.loading ? "Scanning..." : "No files found"}
            </text>
          </Show>
          <For each={entries()}>
            {(entry, index) => (
              <text fg={entry.type === "dir" ? theme.accent : theme.textMuted} wrapMode="none">
                {connector(entry, index(), entries())} {entry.type === "dir" ? "📁" : "📄"} {entry.name}
                {entry.type === "dir" ? "/" : ""}
              </text>
            )}
          </For>
        </box>
      </scrollbox>

      <box flexShrink={0} paddingTop={1}>
        <text fg={theme.textMuted} wrapMode="none">
          {targetDir().dir}
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.success }}>•</span> <b>Open</b>
          <span style={{ fg: theme.text }}>
            <b>Code</b>
          </span>{" "}
          <span>{Installation.VERSION}</span>
        </text>
      </box>
    </box>
  )
}
