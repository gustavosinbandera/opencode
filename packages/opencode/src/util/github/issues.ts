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

export async function listIssues(
  repo: string,
  state?: string,
  limit?: number,
  labels?: string,
): Promise<string> {
  try {
    const args = [
      "gh",
      "issue",
      "list",
      "--repo",
      repo,
      "--state",
      state || "open",
      "--limit",
      String(limit || 20),
      "--json",
      "number,title,state,author,labels,createdAt,updatedAt",
    ]
    if (labels) {
      args.push("--label", labels)
    }

    const raw = execSync(args.join(" "), { encoding: "utf-8" })
    const issues = JSON.parse(raw) as Array<{
      number: number
      title: string
      state: string
      author: { login: string }
      labels: Array<{ name: string }>
      createdAt: string
      updatedAt: string
    }>

    if (issues.length === 0) {
      return `No issues found for ${repo} (state: ${state || "open"}).`
    }

    const rows = issues.map((issue) => {
      const labelStr = issue.labels.map((l) => l.name).join(", ")
      return [
        String(issue.number),
        truncate(issue.title, 50),
        issue.state,
        issue.author.login,
        truncate(labelStr, 20),
        relativeTime(issue.createdAt),
      ]
    })

    return asciiTable({
      title: `Issues for ${repo} (${state || "open"})`,
      headers: ["#", "Title", "State", "Author", "Labels", "Created"],
      rows,
      align: ["right", "left", "left", "left", "left", "left"],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error listing issues: ${message}`
  }
}

export async function listPRs(
  repo: string,
  state?: string,
  limit?: number,
): Promise<string> {
  try {
    const args = [
      "gh",
      "pr",
      "list",
      "--repo",
      repo,
      "--state",
      state || "open",
      "--limit",
      String(limit || 20),
      "--json",
      "number,title,state,author,isDraft,reviewDecision,createdAt,headRefName",
    ]

    const raw = execSync(args.join(" "), { encoding: "utf-8" })
    const prs = JSON.parse(raw) as Array<{
      number: number
      title: string
      state: string
      author: { login: string }
      isDraft: boolean
      reviewDecision: string
      createdAt: string
      headRefName: string
    }>

    if (prs.length === 0) {
      return `No pull requests found for ${repo} (state: ${state || "open"}).`
    }

    const reviewIcon = (decision: string): string => {
      switch (decision) {
        case "APPROVED":
          return "\u2705"
        case "CHANGES_REQUESTED":
          return "\u274C"
        case "REVIEW_REQUIRED":
          return "\u23F3"
        default:
          return "\u2500"
      }
    }

    const rows = prs.map((pr) => [
      String(pr.number),
      truncate(pr.title, 45),
      pr.state,
      pr.author.login,
      truncate(pr.headRefName, 20),
      reviewIcon(pr.reviewDecision),
      pr.isDraft ? "\uD83D\uDCDD" : "",
    ])

    return asciiTable({
      title: `Pull Requests for ${repo} (${state || "open"})`,
      headers: ["#", "Title", "State", "Author", "Branch", "Review", "Draft"],
      rows,
      align: ["right", "left", "left", "left", "left", "center", "center"],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error listing pull requests: ${message}`
  }
}
