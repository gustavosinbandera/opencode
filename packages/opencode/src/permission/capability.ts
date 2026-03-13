export namespace Capability {
  export type Risk = "low" | "medium" | "high" | "critical"
  export type Action = "allow" | "deny" | "ask"

  export interface Info {
    id: string
    permission: string
    source: "native" | "mcp" | "unknown"
    risk: Risk
    defaultAction: Action
    description: string
  }

  const NATIVE: Record<string, Omit<Info, "id" | "permission">> = {
    invalid: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Fallback invalid tool handler used to surface unsupported tool invocations.",
    },
    question: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Interactive clarification questions for user input and decisions.",
    },
    read: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Read-only file and content operations.",
    },
    glob: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Filesystem pattern scanning.",
    },
    grep: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Source content search operations.",
    },
    webfetch: {
      source: "native",
      risk: "medium",
      defaultAction: "allow",
      description: "Read-only remote content retrieval over HTTP(S).",
    },
    websearch: {
      source: "native",
      risk: "medium",
      defaultAction: "allow",
      description: "Remote web search capability for evidence gathering.",
    },
    codesearch: {
      source: "native",
      risk: "medium",
      defaultAction: "allow",
      description: "Indexed code search capability across configured sources.",
    },
    bash: {
      source: "native",
      risk: "high",
      defaultAction: "ask",
      description: "Shell execution against local environment.",
    },
    edit: {
      source: "native",
      risk: "high",
      defaultAction: "ask",
      description: "In-place file edits.",
    },
    write: {
      source: "native",
      risk: "high",
      defaultAction: "ask",
      description: "File creation and overwrite operations.",
    },
    batch: {
      source: "native",
      risk: "high",
      defaultAction: "ask",
      description: "Batch execution of multiple tool calls in one request.",
    },
    apply_patch: {
      source: "native",
      risk: "high",
      defaultAction: "ask",
      description: "Patch application over workspace files.",
    },
    skill: {
      source: "native",
      risk: "medium",
      defaultAction: "allow",
      description: "Skill loading and invocation for reusable workflows.",
    },
    lsp: {
      source: "native",
      risk: "medium",
      defaultAction: "allow",
      description: "Language server analysis and editor-style code intelligence.",
    },
    plan_exit: {
      source: "native",
      risk: "low",
      defaultAction: "allow",
      description: "Exit from plan mode and resume normal execution.",
    },
    task: {
      source: "native",
      risk: "critical",
      defaultAction: "ask",
      description: "Sub-agent task execution with delegated capabilities.",
    },
    doom_loop: {
      source: "native",
      risk: "critical",
      defaultAction: "ask",
      description: "Repeated tool call guard.",
    },
  }

  function mcp(permission: string): boolean {
    return permission.startsWith("usar-mcp_") || permission.startsWith("magaya_")
  }

  export function resolve(permission: string): Info {
    const normalized = permission.trim()
    const exact = NATIVE[normalized]
    if (exact) {
      return {
        id: `cap.${normalized}`,
        permission: normalized,
        ...exact,
      }
    }

    if (mcp(normalized)) {
      return {
        id: `cap.${normalized}`,
        permission: normalized,
        source: "mcp",
        risk: "medium",
        defaultAction: "ask",
        description: "Tool exposed by a connected MCP server.",
      }
    }

    return {
      id: `cap.${normalized}`,
      permission: normalized,
      source: "unknown",
      risk: "high",
      defaultAction: "ask",
      description: "Unclassified capability; apply safe policy defaults.",
    }
  }
}
