import { createSignal, createMemo, createResource, For, Show } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../../context/theme"
import { useSync } from "@tui/context/sync"
import { useDialog } from "../../ui/dialog"
import { Installation } from "@/installation"
import { readdirSync, statSync, existsSync, readFileSync } from "fs"
import pathModule from "path"
import { LANGUAGE_EXTENSIONS } from "@/lsp/language"

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

const MAX_PREVIEW_LINES = 200
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".wasm",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
])


function FileViewer(props: { filePath: string; onClose: () => void }) {
  const { theme, syntax } = useTheme()
  const fileName = pathModule.basename(props.filePath)
  const ext = pathModule.extname(props.filePath).toLowerCase()

  const content = createMemo(() => {
    if (BINARY_EXTENSIONS.has(ext)) {
      try {
        const stat = statSync(props.filePath)
        const size = stat.size > 1024 * 1024
          ? `${(stat.size / 1024 / 1024).toFixed(1)} MB`
          : stat.size > 1024
            ? `${(stat.size / 1024).toFixed(1)} KB`
            : `${stat.size} bytes`
        return `[Binary file: ${size}]`
      } catch {
        return "[Cannot read file]"
      }
    }
    try {
      const raw = readFileSync(props.filePath, "utf-8")
      const lines = raw.split("\n")
      if (lines.length > MAX_PREVIEW_LINES) {
        return lines.slice(0, MAX_PREVIEW_LINES).join("\n") + `\n\n… (${lines.length - MAX_PREVIEW_LINES} more lines)`
      }
      return raw
    } catch {
      return "[Cannot read file]"
    }
  })

  const lang = createMemo(() => {
    const l = LANGUAGE_EXTENSIONS[ext]
    if (!l) return ext.slice(1) || "text"
    if (["typescriptreact", "javascriptreact", "javascript"].includes(l)) return "typescript"
    return l
  })

  // Dialog uses paddingTop = height/4, so available height = height * 3/4 - padding
  const dimensions = useTerminalDimensions()
  const scrollHeight = createMemo(() => Math.max(10, Math.floor(dimensions().height * 3 / 4) - 6))

  return (
    <box paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text}><b>📄 {fileName}</b></text>
        <text fg={theme.textMuted}>esc to close</text>
      </box>
      <text fg={theme.textMuted} wrapMode="none">{props.filePath}</text>
      <scrollbox
        height={scrollHeight()}
        scrollX={true}
        verticalScrollbarOptions={{
          paddingLeft: 1,
          trackOptions: {
            backgroundColor: theme.background,
            foregroundColor: theme.borderActive,
          },
        }}
        horizontalScrollbarOptions={{
          trackOptions: {
            backgroundColor: theme.background,
            foregroundColor: theme.borderActive,
          },
        }}
      >
        <code
          filetype={lang()}
          content={content()}
          drawUnstyledText={false}
          syntaxStyle={syntax()}
          wrapMode="none"
        />
      </scrollbox>
    </box>
  )
}

export function FileExplorer() {
  const { theme } = useTheme()
  const sync = useSync()
  const dialog = useDialog()
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
              <text
                fg={entry.type === "dir" ? theme.accent : theme.textMuted}
                wrapMode="none"
                onMouseUp={(e) => {
                  e.stopPropagation()
                  if (entry.type === "file") {
                    const fullPath = pathModule.join(targetDir().dir, entry.path)
                    dialog.setSize("large")
                    dialog.replace(
                      () => <FileViewer filePath={fullPath} onClose={() => dialog.clear()} />,
                    )
                  } else {
                    setFilter(entry.name)
                  }
                }}
              >
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
