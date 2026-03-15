import { createSignal, createMemo, createResource, For, Show, onMount } from "solid-js"
import { useTheme } from "../../context/theme"
import { useDirectory } from "../../context/directory"
import { Installation } from "@/installation"
import { execSync } from "child_process"
import path from "path"

interface FileEntry {
  name: string
  type: "dir" | "file"
  depth: number
  path: string
}

function scanDirectory(dir: string, filter?: string, maxDepth = 3): FileEntry[] {
  try {
    // Use ripgrep --files for speed, with common ignores
    const ignores = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".cache",
      "__pycache__",
      ".next",
      "target",
      "coverage",
      ".turbo",
    ]
    const ignoreArgs = ignores.map((i) => `--glob "!${i}"`).join(" ")
    const cmd = `rg --files ${ignoreArgs} --sort path "${dir}" 2>/dev/null | head -500`
    const raw = execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim()
    if (!raw) return []

    const files = raw.split("\n").map((f) => f.replace(/\\/g, "/"))
    const dirNorm = dir.replace(/\\/g, "/").replace(/\/$/, "")

    // Build tree entries
    const seen = new Set<string>()
    const entries: FileEntry[] = []

    for (const file of files) {
      const rel = file.startsWith(dirNorm) ? file.slice(dirNorm.length + 1) : file
      if (!rel) continue

      const parts = rel.split("/")
      if (parts.length > maxDepth) continue

      // Apply filter
      if (filter) {
        const lower = filter.toLowerCase()
        if (!rel.toLowerCase().includes(lower)) continue
      }

      // Add parent directories
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join("/")
        if (!seen.has(dirPath)) {
          seen.add(dirPath)
          entries.push({ name: parts[i], type: "dir", depth: i, path: dirPath })
        }
      }

      // Add file
      const filePath = parts.join("/")
      if (!seen.has(filePath)) {
        seen.add(filePath)
        entries.push({ name: parts[parts.length - 1], type: "file", depth: parts.length - 1, path: filePath })
      }
    }

    // Sort: directories first at each level, then files, alphabetically
    entries.sort((a, b) => {
      if (a.depth !== b.depth) {
        // Compare by common path prefix
        const aParts = a.path.split("/")
        const bParts = b.path.split("/")
        const minLen = Math.min(aParts.length, bParts.length)
        for (let i = 0; i < minLen; i++) {
          if (aParts[i] !== bParts[i]) {
            // At this level, dirs come first
            const aIsDir = i < aParts.length - 1 || a.type === "dir"
            const bIsDir = i < bParts.length - 1 || b.type === "dir"
            if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
            return aParts[i].localeCompare(bParts[i])
          }
        }
      }
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1
      return a.path.localeCompare(b.path)
    })

    return entries
  } catch {
    return []
  }
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
