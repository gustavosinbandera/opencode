import { execSync } from "child_process"
import { asciiTable } from "../ascii-diagram"

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + "\u2026"
}

interface TreeEntry {
  name: string
  type: "dir" | "file"
}

function renderTree(entries: TreeEntry[], prefix: string = ""): string[] {
  const dirs = entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name))
  const files = entries.filter((e) => e.type === "file").sort((a, b) => a.name.localeCompare(b.name))
  const sorted = [...dirs, ...files]
  const lines: string[] = []

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    const isLast = i === sorted.length - 1
    const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"
    const icon = entry.type === "dir" ? "\uD83D\uDCC1" : "\uD83D\uDCC4"
    const suffix = entry.type === "dir" ? "/" : ""
    lines.push(`${prefix}${connector} ${icon} ${entry.name}${suffix}`)
  }

  return lines
}

export async function repoTree(
  repo: string,
  path?: string,
  depth?: number,
): Promise<string> {
  try {
    const maxDepth = depth ?? 1
    const contentsPath = path || ""
    const cmd = `MSYS_NO_PATHCONV=1 gh api "repos/${repo}/git/trees/HEAD?recursive=1" --jq ".tree[] | .path + \\"\\t\\" + .type"`
    const raw = execSync(cmd, { encoding: "utf-8" }).trim()

    if (!raw) {
      return `No files found in ${repo}${contentsPath ? `/${contentsPath}` : ""}.`
    }

    const allEntries = raw.split("\n").map((line) => {
      const [filePath, type] = line.split("\t")
      return { path: filePath, type: type as "blob" | "tree" }
    })

    // Filter by prefix path if provided
    const filtered = contentsPath
      ? allEntries.filter(
          (e) => e.path.startsWith(contentsPath + "/") || e.path === contentsPath,
        )
      : allEntries

    // Build nested structure respecting depth
    const baseParts = contentsPath ? contentsPath.split("/").length : 0

    // Collect unique entries at each level up to maxDepth
    interface TreeNode {
      name: string
      type: "dir" | "file"
      children: Map<string, TreeNode>
    }

    const root: Map<string, TreeNode> = new Map()

    for (const entry of filtered) {
      const relativePath = contentsPath
        ? entry.path.slice(contentsPath.length + 1)
        : entry.path
      if (!relativePath) continue

      const parts = relativePath.split("/")
      if (parts.length > maxDepth) continue

      let current = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isLeaf = i === parts.length - 1
        if (!current.has(part)) {
          current.set(part, {
            name: part,
            type: isLeaf && entry.type === "blob" ? "file" : "dir",
            children: new Map(),
          })
        }
        if (!isLeaf) {
          current = current.get(part)!.children
        }
      }
    }

    // Render tree recursively
    function renderNodes(nodes: Map<string, TreeNode>, prefix: string): string[] {
      const dirs = [...nodes.values()]
        .filter((n) => n.type === "dir")
        .sort((a, b) => a.name.localeCompare(b.name))
      const files = [...nodes.values()]
        .filter((n) => n.type === "file")
        .sort((a, b) => a.name.localeCompare(b.name))
      const sorted = [...dirs, ...files]
      const lines: string[] = []

      for (let i = 0; i < sorted.length; i++) {
        const node = sorted[i]
        const isLast = i === sorted.length - 1
        const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"
        const icon = node.type === "dir" ? "\uD83D\uDCC1" : "\uD83D\uDCC4"
        const suffix = node.type === "dir" ? "/" : ""
        lines.push(`${prefix}${connector} ${icon} ${node.name}${suffix}`)

        if (node.children.size > 0) {
          const childPrefix = prefix + (isLast ? "    " : "\u2502   ")
          lines.push(...renderNodes(node.children, childPrefix))
        }
      }

      return lines
    }

    const header = `📁 ${repo}${contentsPath ? `/${contentsPath}` : ""}/`
    const treeLines = renderNodes(root, "")
    const maxLines = 60
    if (treeLines.length > maxLines) {
      const shown = treeLines.slice(0, maxLines)
      shown.push(`\n… and ${treeLines.length - maxLines} more entries (use path parameter to explore subdirectories)`)
      return [header, ...shown].join("\n")
    }
    return [header, ...treeLines].join("\n")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error fetching repo tree: ${message}`
  }
}

export async function listReleases(
  repo: string,
  limit?: number,
): Promise<string> {
  try {
    const cmd = [
      "gh",
      "release",
      "list",
      "--repo",
      repo,
      "--limit",
      String(limit || 10),
      "--json",
      "tagName,name,publishedAt,isPrerelease,isDraft",
    ].join(" ")

    const raw = execSync(cmd, { encoding: "utf-8" })
    const releases = JSON.parse(raw) as Array<{
      tagName: string
      name: string
      publishedAt: string
      isPrerelease: boolean
      isDraft: boolean
    }>

    if (releases.length === 0) {
      return `No releases found for ${repo}.`
    }

    const rows = releases.map((r) => [
      r.tagName,
      truncate(r.name || "", 40),
      relativeTime(r.publishedAt),
      r.isPrerelease ? "\u26A0\uFE0F" : "",
      r.isDraft ? "\uD83D\uDCDD" : "",
    ])

    return asciiTable({
      title: `Releases for ${repo}`,
      headers: ["Tag", "Name", "Published", "Pre-release", "Draft"],
      rows,
      align: ["left", "left", "left", "center", "center"],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error listing releases: ${message}`
  }
}

export async function listActions(
  repo: string,
  limit?: number,
): Promise<string> {
  try {
    const cmd = [
      "gh",
      "run",
      "list",
      "--repo",
      repo,
      "--limit",
      String(limit || 10),
      "--json",
      "databaseId,displayTitle,status,conclusion,headBranch,createdAt,event",
    ].join(" ")

    const raw = execSync(cmd, { encoding: "utf-8" })
    const runs = JSON.parse(raw) as Array<{
      databaseId: number
      displayTitle: string
      status: string
      conclusion: string
      headBranch: string
      createdAt: string
      event: string
    }>

    if (runs.length === 0) {
      return `No workflow runs found for ${repo}.`
    }

    const statusIcon = (status: string, conclusion: string): string => {
      if (status === "in_progress") return "\uD83D\uDD04 in_progress"
      if (status === "queued") return "\u23F3 queued"
      switch (conclusion) {
        case "success":
          return "\u2705 success"
        case "failure":
          return "\u274C failure"
        case "cancelled":
          return "\u23F8\uFE0F cancelled"
        default:
          return status
      }
    }

    const rows = runs.map((r) => [
      String(r.databaseId),
      truncate(r.displayTitle, 40),
      statusIcon(r.status, r.conclusion),
      truncate(r.headBranch, 20),
      r.event,
      relativeTime(r.createdAt),
    ])

    return asciiTable({
      title: `Workflow Runs for ${repo}`,
      headers: ["ID", "Title", "Status", "Branch", "Event", "Created"],
      rows,
      align: ["right", "left", "left", "left", "left", "left"],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error listing workflow runs: ${message}`
  }
}

export { relativeTime }
