import { createSignal, createMemo, createResource, For, Show, onMount } from "solid-js"
import { useTheme } from "../../context/theme"
import { useDirectory } from "../../context/directory"
import { Installation } from "@/installation"
import { readdirSync, statSync } from "fs"
import path from "path"

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

function scanDirectory(dir: string, filter?: string, maxDepth = 2): FileEntry[] {
  const entries: FileEntry[] = []
  const filterLower = filter?.toLowerCase()

  function walk(currentDir: string, depth: number, relPath: string) {
    if (depth > maxDepth) return
    let items: string[]
    try {
      items = readdirSync(currentDir)
    } catch {
      return
    }

    // Separate dirs and files, sort each alphabetically
    const dirs: string[] = []
    const files: string[] = []
    for (const item of items) {
      if (item.startsWith(".") && item !== ".env") continue
      if (IGNORE.has(item)) continue
      try {
        const fullPath = path.join(currentDir, item)
        const stat = statSync(fullPath)
        if (stat.isDirectory()) dirs.push(item)
        else files.push(item)
      } catch {
        continue
      }
    }

    dirs.sort((a, b) => a.localeCompare(b))
    files.sort((a, b) => a.localeCompare(b))

    for (const name of dirs) {
      const rel = relPath ? `${relPath}/${name}` : name
      if (!filterLower || rel.toLowerCase().includes(filterLower) || name.toLowerCase().includes(filterLower)) {
        entries.push({ name, type: "dir", depth, path: rel })
      }
      walk(path.join(currentDir, name), depth + 1, rel)
    }

    for (const name of files) {
      const rel = relPath ? `${relPath}/${name}` : name
      if (filterLower && !rel.toLowerCase().includes(filterLower) && !name.toLowerCase().includes(filterLower)) continue
      entries.push({ name, type: "file", depth, path: rel })
    }
  }

  try {
    walk(dir, 0, "")
  } catch {}

  return entries
}

export function FileExplorer() {
  const { theme } = useTheme()
  const directory = useDirectory()
  const [filter, setFilter] = createSignal("")
  const [depth, setDepth] = createSignal(2)

  const [entries, { refetch }] = createResource(
    () => ({ dir: directory(), filter: filter(), depth: depth() }),
    (opts) => scanDirectory(opts.dir, opts.filter || undefined, opts.depth),
    { initialValue: [] },
  )

  onMount(() => refetch())

  const dirName = createMemo(() => {
    const parts = directory().replace(/\\/g, "/").split("/")
    return parts[parts.length - 1] || directory()
  })

  const fileCount = createMemo(() => entries().filter((e) => e.type === "file").length)
  const dirCount = createMemo(() => entries().filter((e) => e.type === "dir").length)

  // Tree connector characters
  const connector = (entry: FileEntry, index: number, all: FileEntry[]) => {
    // Find if this is the last entry at its depth level among siblings
    let isLast = true
    for (let i = index + 1; i < all.length; i++) {
      if (all[i].depth < entry.depth) break
      if (all[i].depth === entry.depth) {
        isLast = false
        break
      }
    }
    const prefix = "  ".repeat(entry.depth)
    return prefix + (isLast ? "└─" : "├─")
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
          <b>📁 File Explorer</b>
        </text>
        <text fg={theme.textMuted}>
          {dirName()} · {fileCount()} files · {dirCount()} dirs
        </text>
      </box>

      <box flexShrink={0} paddingBottom={1}>
        <text fg={theme.textMuted}>
          🔍 {filter() || "type to filter..."}
        </text>
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
        <text>
          <span style={{ fg: theme.textMuted }}>{directory().replace(/\\/g, "/").split("/").slice(0, -1).join("/")}/</span>
          <span style={{ fg: theme.text }}>{dirName()}</span>
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
