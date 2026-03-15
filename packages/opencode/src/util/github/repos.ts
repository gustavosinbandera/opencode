import { execSync } from "child_process"
import { asciiTable } from "../ascii-diagram"

/**
 * Convert an ISO date string to a relative time string (e.g. "2d ago", "3mo ago").
 */
export function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  if (isNaN(then)) return "unknown"

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "just now"
}

/**
 * List GitHub repositories for a given owner (user or org).
 * Returns a formatted ASCII table string.
 */
export async function listRepos(owner?: string, limit?: number): Promise<string> {
  try {
    const ownerArg = owner || ""
    const limitArg = limit || 20
    const cmd = `gh repo list ${ownerArg} --limit ${limitArg} --json name,description,stargazerCount,language,isPrivate,updatedAt`
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim()

    if (!output) {
      return "No repositories found."
    }

    const repos: Array<{
      name: string
      description: string | null
      stargazerCount: number
      language: string | null
      isPrivate: boolean
      updatedAt: string
    }> = JSON.parse(output)

    if (repos.length === 0) {
      return "No repositories found."
    }

    const rows = repos.map((r) => {
      const desc = r.description || ""
      const truncDesc = desc.length > 40 ? desc.slice(0, 37) + "..." : desc
      return [
        r.name,
        String(r.stargazerCount),
        r.language || "-",
        r.isPrivate ? "Yes" : "No",
        relativeTime(r.updatedAt),
        truncDesc,
      ]
    })

    return asciiTable({
      headers: ["Name", "Stars", "Language", "Private", "Updated", "Description"],
      rows,
      align: ["left", "right", "left", "center", "right", "left"],
      title: owner ? `Repositories for ${owner}` : "Your Repositories",
    })
  } catch (err: any) {
    return `Error listing repositories: ${err.message || String(err)}`
  }
}

/**
 * View detailed information about a GitHub repository.
 * Returns a formatted string with repo stats, description, URL, and README excerpt.
 */
export async function viewRepo(repo: string): Promise<string> {
  try {
    const cmd = `gh repo view ${repo} --json name,description,stargazerCount,forkCount,watchers,language,defaultBranchRef,licenseInfo,url,isPrivate,createdAt,updatedAt,homepageUrl`
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim()

    const info: {
      name: string
      description: string | null
      stargazerCount: number
      forkCount: number
      watchers: { totalCount: number }
      language: string | null
      defaultBranchRef: { name: string } | null
      licenseInfo: { name: string } | null
      url: string
      isPrivate: boolean
      createdAt: string
      updatedAt: string
      homepageUrl: string | null
    } = JSON.parse(output)

    const sections: string[] = []

    // Title
    const visibility = info.isPrivate ? " (private)" : " (public)"
    sections.push(`${repo}${visibility}`)
    sections.push("=".repeat(repo.length + visibility.length))

    // Stats table
    const statsTable = asciiTable({
      headers: ["Stars", "Forks", "Watchers", "Language", "License", "Created"],
      rows: [
        [
          String(info.stargazerCount),
          String(info.forkCount),
          String(info.watchers?.totalCount ?? 0),
          info.language || "-",
          info.licenseInfo?.name || "None",
          relativeTime(info.createdAt),
        ],
      ],
      align: ["right", "right", "right", "left", "left", "right"],
    })
    sections.push(statsTable)

    // Description
    if (info.description) {
      sections.push(`\nDescription: ${info.description}`)
    }

    // URLs
    sections.push(`URL: ${info.url}`)
    if (info.homepageUrl) {
      sections.push(`Homepage: ${info.homepageUrl}`)
    }

    // Default branch
    if (info.defaultBranchRef) {
      sections.push(`Default branch: ${info.defaultBranchRef.name}`)
    }

    // Last updated
    sections.push(`Updated: ${relativeTime(info.updatedAt)}`)

    // README
    try {
      const readmeB64 = execSync(`gh api repos/${repo}/readme --jq ".content"`, {
        encoding: "utf-8",
        timeout: 15000,
      }).trim()

      if (readmeB64) {
        const readme = Buffer.from(readmeB64, "base64").toString("utf-8")
        const readmeLines = readme.split("\n").slice(0, 20)
        sections.push(`\n--- README (first 20 lines) ---`)
        sections.push(readmeLines.join("\n"))
        if (readme.split("\n").length > 20) {
          sections.push("...")
        }
      }
    } catch {
      // README not available — skip silently
    }

    return sections.join("\n")
  } catch (err: any) {
    return `Error viewing repository: ${err.message || String(err)}`
  }
}
