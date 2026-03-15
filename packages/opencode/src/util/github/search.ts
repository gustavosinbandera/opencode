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
 * Escape a string for safe use in a shell command argument.
 */
function shellEscape(str: string): string {
  return `"${str.replace(/"/g, '\\"')}"`
}

/**
 * Search for code patterns across GitHub repositories.
 * Returns a formatted ASCII table string.
 *
 * Tries `gh search code` first; if that fails (e.g. --json not supported),
 * falls back to the `gh api search/code` endpoint.
 */
export async function searchCode(
  query: string,
  opts?: { language?: string; repo?: string; org?: string; limit?: number },
): Promise<string> {
  const limit = opts?.limit || 15

  try {
    // Build the gh search code command
    const parts = ["gh", "search", "code", shellEscape(query)]
    if (opts?.language) parts.push("--language", shellEscape(opts.language))
    if (opts?.repo) parts.push("--repo", opts.repo)
    if (opts?.org) parts.push("--owner", opts.org)
    parts.push("--limit", String(limit))
    parts.push("--json", "repository,path,textMatches")

    const cmd = parts.join(" ")
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim()

    if (!output) {
      return "No code results found."
    }

    const results: Array<{
      repository: { nameWithOwner?: string; fullName?: string; name?: string }
      path: string
      textMatches?: Array<{ fragment?: string }>
    }> = JSON.parse(output)

    if (results.length === 0) {
      return "No code results found."
    }

    const rows = results.map((r) => {
      const repoName = r.repository.nameWithOwner || r.repository.fullName || r.repository.name || "unknown"
      const matchCount = r.textMatches?.length ?? 0
      let matchInfo: string
      if (r.textMatches && r.textMatches.length > 0 && r.textMatches[0].fragment) {
        const frag = r.textMatches[0].fragment.replace(/\n/g, " ").trim()
        matchInfo = frag.length > 50 ? frag.slice(0, 47) + "..." : frag
      } else {
        matchInfo = `${matchCount} match${matchCount !== 1 ? "es" : ""}`
      }
      return [repoName, r.path, matchInfo]
    })

    return asciiTable({
      headers: ["Repository", "File", "Matches"],
      rows,
      title: `Code search: ${query}`,
    })
  } catch {
    // Fallback to gh api
    return searchCodeViaApi(query, opts)
  }
}

/**
 * Fallback code search using the GitHub REST API via `gh api`.
 */
async function searchCodeViaApi(
  query: string,
  opts?: { language?: string; repo?: string; org?: string; limit?: number },
): Promise<string> {
  const limit = opts?.limit || 15

  try {
    let q = query
    if (opts?.language) q += `+language:${opts.language}`
    if (opts?.repo) q += `+repo:${opts.repo}`
    if (opts?.org) q += `+org:${opts.org}`

    const endpoint = `search/code?q=${encodeURIComponent(q)}&per_page=${limit}`

    // On Windows (MSYS/Git Bash), gh api can mangle paths; MSYS_NO_PATHCONV prevents that
    const prefix = process.platform === "win32" ? "MSYS_NO_PATHCONV=1 " : ""
    const cmd = `${prefix}gh api "${endpoint}"`
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim()

    if (!output) {
      return "No code results found."
    }

    const data: {
      total_count: number
      items: Array<{
        repository: { full_name: string }
        path: string
        text_matches?: Array<{ fragment?: string }>
      }>
    } = JSON.parse(output)

    if (!data.items || data.items.length === 0) {
      return "No code results found."
    }

    const rows = data.items.map((item) => {
      const repoName = item.repository.full_name
      const matchCount = item.text_matches?.length ?? 0
      let matchInfo: string
      if (item.text_matches && item.text_matches.length > 0 && item.text_matches[0].fragment) {
        const frag = item.text_matches[0].fragment.replace(/\n/g, " ").trim()
        matchInfo = frag.length > 50 ? frag.slice(0, 47) + "..." : frag
      } else {
        matchInfo = `${matchCount} match${matchCount !== 1 ? "es" : ""}`
      }
      return [repoName, item.path, matchInfo]
    })

    return asciiTable({
      headers: ["Repository", "File", "Matches"],
      rows,
      title: `Code search: ${query} (${data.total_count} total results)`,
    })
  } catch (err: any) {
    return `Error searching code: ${err.message || String(err)}`
  }
}

/**
 * Search GitHub repositories by query.
 * Returns a formatted ASCII table string.
 */
export async function searchRepos(
  query: string,
  opts?: { language?: string; sort?: string; limit?: number },
): Promise<string> {
  try {
    const limit = opts?.limit || 15
    const sort = opts?.sort || "stars"

    const parts = ["gh", "search", "repos", shellEscape(query)]
    if (opts?.language) parts.push("--language", shellEscape(opts.language))
    parts.push("--sort", sort)
    parts.push("--limit", String(limit))
    parts.push("--json", "fullName,description,stargazerCount,language,updatedAt")

    const cmd = parts.join(" ")
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim()

    if (!output) {
      return "No repositories found."
    }

    const repos: Array<{
      fullName: string
      description: string | null
      stargazerCount: number
      language: string | null
      updatedAt: string
    }> = JSON.parse(output)

    if (repos.length === 0) {
      return "No repositories found."
    }

    const rows = repos.map((r) => {
      const desc = r.description || ""
      const truncDesc = desc.length > 40 ? desc.slice(0, 37) + "..." : desc
      return [
        r.fullName,
        String(r.stargazerCount),
        r.language || "-",
        relativeTime(r.updatedAt),
        truncDesc,
      ]
    })

    return asciiTable({
      headers: ["Repository", "Stars", "Language", "Updated", "Description"],
      rows,
      align: ["left", "right", "left", "right", "left"],
      title: `Repository search: ${query}`,
    })
  } catch (err: any) {
    return `Error searching repositories: ${err.message || String(err)}`
  }
}
