import type { MessageV2 } from "@/session/message-v2"

export namespace Policy {
  export type Intent = "execute" | "context_only" | "unknown"
  export type Profile = "strict" | "balanced" | "fast"
  export type Risk = "low" | "medium" | "high" | "critical"
  export type Action = "allow" | "ask" | "deny"

  export type Input = {
    profile?: string
    permission: string
    pattern: string
    risk: Risk
    metadata?: Record<string, unknown>
  }

  export type Output = {
    action: Action
    rule: string
    reason: string
  }

  const ORDER: Record<Risk, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  }

  const BLOCK = [
    /\brm\s+-rf\b/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-fdx?\b/i,
    /\bdel\s+\/s\s+\/q\b/i,
    /\bformat\s+[a-z]:\b/i,
  ]

  const COMMIT = [/\bgit\s+commit\b/i, /\bgit\s+push\b/i]
  const RUN = [
    /\bimplement\b/i,
    /\bejecuta\b/i,
    /\bexecute\b/i,
    /\baplica\b/i,
    /\bcommit\b/i,
    /\bpush\b/i,
    /\bcambia\b/i,
  ]
  const CONTEXT = [
    /\bexplica\b/i,
    /\banaliza\b/i,
    /\bresumen\b/i,
    /\bwhat did we do\b/i,
    /\bque hicimos\b/i,
    /\bte comparti\b/i,
    /\bsolo contexto\b/i,
  ]

  function rank(risk: Risk, min: Risk) {
    return ORDER[risk] >= ORDER[min]
  }

  function text(msgs: MessageV2.WithParts[]) {
    const user = msgs.findLast((item) => item.info.role === "user")
    if (!user) return ""
    return user.parts
      .filter((part): part is MessageV2.TextPart => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim()
  }

  function parseProfile(input?: string): Profile {
    if (input === "strict" || input === "balanced" || input === "fast") return input
    return "strict"
  }

  export function infer(text: string): Intent {
    if (!text.trim()) return "unknown"
    if (RUN.some((item) => item.test(text))) return "execute"
    if (CONTEXT.some((item) => item.test(text))) return "context_only"
    return "unknown"
  }

  export function fromMessages(msgs: MessageV2.WithParts[]) {
    return infer(text(msgs))
  }

  export function decide(input: Input): Output | undefined {
    const profile = parseProfile(input.profile)
    const intent = input.metadata?.intent
    const value = typeof intent === "string" ? intent : "unknown"

    if (input.permission === "bash" && BLOCK.some((item) => item.test(input.pattern))) {
      return {
        action: "deny",
        rule: "block_destructive_ops",
        reason: "Destructive shell operation blocked by policy.",
      }
    }

    if (profile !== "fast" && input.permission === "bash" && COMMIT.some((item) => item.test(input.pattern))) {
      return {
        action: "ask",
        rule: "require_confirm_for_commit_push",
        reason: "Commit or push requires explicit confirmation.",
      }
    }

    if (profile !== "fast" && value === "context_only" && rank(input.risk, "medium")) {
      return {
        action: "deny",
        rule: "intent_gating_context_only",
        reason: "Execution denied because user intent is context-only.",
      }
    }

    if (profile === "strict" && value !== "execute" && rank(input.risk, "medium")) {
      return {
        action: "ask",
        rule: "require_explain_before_execute",
        reason: "Medium/high risk actions require explicit execution intent in strict profile.",
      }
    }
  }
}
