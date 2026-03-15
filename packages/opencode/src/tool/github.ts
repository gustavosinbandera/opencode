import z from "zod"
import { Tool } from "./tool"
import { listRepos, viewRepo } from "../util/github/repos"
import { listIssues, listPRs } from "../util/github/issues"
import { repoTree, listReleases, listActions } from "../util/github/tree"
import { searchCode, searchRepos } from "../util/github/search"

const DESCRIPTION = `PREFERRED tool for ALL GitHub operations. Always use this tool instead of bash/curl/gh commands when the user asks about GitHub repos, issues, PRs, file trees, releases, CI status, or code search.
NEVER use bash with curl or gh commands for GitHub operations — always use this tool instead. It renders formatted output inline in the terminal.

Available actions:
- "repos": List repositories for a user/org
- "view": View detailed repo info with README
- "issues": List issues for a repo
- "prs": List pull requests for a repo
- "tree": Show file tree of a repo
- "releases": List releases for a repo
- "actions": List CI/CD workflow runs
- "search-code": Search code patterns across repos
- "search-repos": Search repositories by topic/keyword

Examples:
  action: "repos", owner: "facebook"
  action: "issues", repo: "vercel/next.js", state: "open"
  action: "tree", repo: "anthropics/claude-code"
  action: "search-code", query: "createContext", language: "typescript", org: "facebook"
`

export const GitHubTool = Tool.define("github", {
  description: DESCRIPTION,
  parameters: z.object({
    action: z
      .enum(["repos", "view", "issues", "prs", "tree", "releases", "actions", "search-code", "search-repos"])
      .describe("The GitHub action to perform"),
    repo: z.string().optional().describe('Repository in "owner/repo" format'),
    owner: z.string().optional().describe("GitHub username or organization (for repos action)"),
    query: z.string().optional().describe("Search query (for search actions)"),
    state: z.string().optional().describe('Filter by state: "open", "closed", "all" (for issues/prs)'),
    language: z.string().optional().describe("Filter by language (for search actions)"),
    labels: z.string().optional().describe("Filter by labels (for issues)"),
    path: z.string().optional().describe("Path within repo (for tree action)"),
    limit: z.number().optional().describe("Max results to return (default: 20)"),
  }),
  async execute(params, _ctx) {
    const { action, repo, query } = params
    const meta = { action, repo, query } as Record<string, any>
    const err = (msg: string) => ({ title: `github ${action}`, metadata: meta, output: msg })

    let output: string

    switch (action) {
      case "repos":
        output = await listRepos(params.owner, params.limit)
        break
      case "view":
        if (!repo) return err("Error: repo parameter is required")
        output = await viewRepo(repo)
        break
      case "issues":
        if (!repo) return err("Error: repo parameter is required")
        output = await listIssues(repo, params.state, params.limit, params.labels)
        break
      case "prs":
        if (!repo) return err("Error: repo parameter is required")
        output = await listPRs(repo, params.state, params.limit)
        break
      case "tree":
        if (!repo) return err("Error: repo parameter is required")
        output = await repoTree(repo, params.path)
        break
      case "releases":
        if (!repo) return err("Error: repo parameter is required")
        output = await listReleases(repo, params.limit)
        break
      case "actions":
        if (!repo) return err("Error: repo parameter is required")
        output = await listActions(repo, params.limit)
        break
      case "search-code":
        if (!query) return err("Error: query parameter is required")
        output = await searchCode(query, {
          language: params.language,
          repo,
          org: params.owner,
          limit: params.limit,
        })
        break
      case "search-repos":
        if (!query) return err("Error: query parameter is required")
        output = await searchRepos(query, {
          language: params.language,
          limit: params.limit,
        })
        break
      default:
        output = `Unknown action: ${action}`
    }

    return {
      title: `github ${action}`,
      metadata: meta,
      output,
    }
  },
})
