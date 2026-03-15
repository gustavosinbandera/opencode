import { createSignal, createMemo, createResource, For, Show, onMount } from "solid-js"
import { useTheme } from "../../context/theme"
import { useSync } from "@tui/context/sync"
import { Installation } from "@/installation"
import { readdirSync, statSync, existsSync } from "fs"
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
    if (entries.length > 500) return
    let items: string[]
    try {
      items = readdirSync(currentDir)
    } catch {
      return
    }

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
  const sync = useSync()
  const [filter, setFilter] = createSignal("")

  // Get the real directory path from sync (not the display version with ~ and branch)
  const realDir = createMemo(() => {
    const dir = sync.data.path.directory || process.cwd()
    return dir.replace(/\\/g, "/")
  })

  // If user types a full path, use it; otherwise filter within the project dir
  const targetDir = createMemo(() => {
    const f = filter().trim()
    if (f && (f.startsWith("/") || f.match(/^[A-Za-z]:/))) {
      // Absolute path — browse that directory
      const normalized = f.replace(/\\/g, "/")
      if (existsSync(normalized)) return { dir: normalized, filter: undefined }
    }
    return { dir: realDir(), filter: f || undefined }
  })

  const [entries, { refetch }] = createResource(
    () => targetDir(),
    (opts) => scanDirectory(opts.dir, opts.filter, opts.filter ? 4 : 2),
    { initialValue: [] },
  )

  onMount(() => refetch())

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
        <input
          onInput={(e) => setFilter(e)}
          focusedBackgroundColor={theme.backgroundElement}
          cursorColor={theme.primary}
          focusedTextColor={theme.text}
          textColor={theme.textMuted}
          placeholder="🔍 filter or path..."
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
