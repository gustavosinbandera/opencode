import { createSignal, createMemo, For, Show } from "solid-js"
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

function scanWithExpanded(dir: string, expandedSet: Set<string>, filter?: string): FileEntry[] {
  const entries: FileEntry[] = []
  const filterLower = filter?.toLowerCase()

  function walk(currentDir: string, depth: number, relPath: string) {
    if (entries.length > 500) return
    const { dirs, files } = listDir(currentDir)

    for (const name of dirs) {
      const rel = relPath ? `${relPath}/${name}` : name
      if (filterLower && !name.toLowerCase().includes(filterLower) && !rel.toLowerCase().includes(filterLower)) continue
      entries.push({ name, type: "dir", depth, path: rel })
      if (expandedSet.has(rel)) {
        walk(pathModule.join(currentDir, name), depth + 1, rel)
      }
    }
    for (const name of files) {
      const rel = relPath ? `${relPath}/${name}` : name
      if (filterLower && !name.toLowerCase().includes(filterLower) && !rel.toLowerCase().includes(filterLower)) continue
      entries.push({ name, type: "file", depth, path: rel })
    }
  }

  walk(dir, 0, "")
  return entries
}

const MAX_PREVIEW_LINES = 200
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".wasm",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
])


function getGitDiff(filePath: string, commits = 1): string {
  try {
    const { execSync } = require("child_process") as typeof import("child_process")
    const dir = pathModule.dirname(filePath)
    if (commits === 0) {
      // Uncommitted changes: working tree vs HEAD
      const diff = execSync(`git diff HEAD -- "${filePath}"`, { encoding: "utf-8", cwd: dir, timeout: 5000 }).trim()
      if (diff) return diff
      return "[No uncommitted changes]"
    }
    // What changed in the last N commits for this file
    const diff = execSync(`git diff HEAD~${commits}..HEAD -- "${filePath}"`, { encoding: "utf-8", cwd: dir, timeout: 5000 }).trim()
    if (diff) return diff
    return `[File not modified in last ${commits} commit${commits > 1 ? "s" : ""}]`
  } catch {
    return "[Not a git repository or git not available]"
  }
}

type ViewMode = "file" | "diff0" | "diff1" | "diff2" | "diff3" | "diff4"

function FileViewer(props: { filePath: string; onClose: () => void }) {
  const { theme, syntax } = useTheme()
  const fileName = pathModule.basename(props.filePath)
  const ext = pathModule.extname(props.filePath).toLowerCase()
  const [mode, setMode] = createSignal<ViewMode>("file")

  const fileContent = createMemo(() => {
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

  const content = createMemo(() => {
    const m = mode()
    if (m === "file") return fileContent()
    const commits = parseInt(m.replace("diff", ""))
    return getGitDiff(props.filePath, commits)
  })

  const lang = createMemo(() => {
    if (mode() !== "file") return "diff"
    const l = LANGUAGE_EXTENSIONS[ext]
    if (!l) return ext.slice(1) || "text"
    if (["typescriptreact", "javascriptreact", "javascript"].includes(l)) return "typescript"
    return l
  })

  const dimensions = useTerminalDimensions()
  const scrollHeight = createMemo(() => Math.max(10, Math.floor(dimensions().height * 3 / 4) - 8))

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "file", label: "📄 File" },
    { id: "diff0", label: "± Uncommitted" },
    { id: "diff1", label: "~1" },
    { id: "diff2", label: "~2" },
    { id: "diff3", label: "~3" },
    { id: "diff4", label: "~4" },
  ]

  return (
    <box paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text}><b>📄 {fileName}</b></text>
        <box onMouseDown={(e) => { e.stopPropagation(); props.onClose() }}>
          <text><span style={{ fg: theme.accent, bold: true }}>✕ close</span></text>
        </box>
      </box>
      <text fg={theme.textMuted}>{props.filePath}</text>
      <box flexDirection="row" gap={1}>
        {tabs.map((tab) => (
          <box onMouseDown={(e) => { e.stopPropagation(); setMode(tab.id) }}>
            <text>
              <span style={{
                fg: mode() === tab.id ? (tab.id === "file" ? theme.accent : theme.warning) : theme.textMuted,
                bold: mode() === tab.id,
              }}>
                {tab.label}
              </span>
            </text>
          </box>
        ))}
      </box>
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
  const [expanded, setExpanded] = createSignal(new Set<string>())
  const [version, setVersion] = createSignal(0)
  let inputRef: any

  function toggleExpand(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
    setVersion((v) => v + 1)
  }

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

  const entries = createMemo(() => {
    version() // track changes
    const opts = targetDir()
    return scanWithExpanded(opts.dir, expanded(), opts.filter || undefined)
  })

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
    const prefix = "  ".repeat(entry.depth) + (isLast ? "└─" : "├─")
    if (entry.type === "dir") {
      const arrow = expanded().has(entry.path) ? "▼" : "▶"
      return prefix + " " + arrow
    }
    return prefix
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
              {"No files found"}
            </text>
          </Show>
          <For each={entries()}>
            {(entry, index) => (
              <box
                flexDirection="row"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  if (entry.type === "dir") {
                    toggleExpand(entry.path)
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation()
                  if (entry.type === "file") {
                    const fullPath = pathModule.join(targetDir().dir, entry.path)
                    dialog.setSize("large")
                    dialog.replace(
                      () => <FileViewer filePath={fullPath} onClose={() => dialog.clear()} />,
                    )
                  }
                }}
              >
                <text fg={entry.type === "dir" ? theme.accent : theme.textMuted} wrapMode="none">
                  {connector(entry, index(), entries())} {entry.type === "dir" ? "📁" : "📄"} {entry.name}
                  {entry.type === "dir" ? "/" : ""}
                </text>
              </box>
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
