import { describe, expect, test } from "bun:test"
import { Policy } from "./engine"

describe("Policy.decide", () => {
  test("blocks destructive bash commands", () => {
    const out = Policy.decide({
      profile: "balanced",
      permission: "bash",
      pattern: "git reset --hard HEAD~1",
      risk: "high",
      metadata: { intent: "execute" },
    })
    expect(out?.action).toBe("deny")
    expect(out?.rule).toBe("block_destructive_ops")
  })

  test("asks confirmation for commit and push", () => {
    const out = Policy.decide({
      profile: "balanced",
      permission: "bash",
      pattern: "git commit -m \"save\"",
      risk: "high",
      metadata: { intent: "execute" },
    })
    expect(out?.action).toBe("ask")
    expect(out?.rule).toBe("require_confirm_for_commit_push")
  })

  test("denies medium risk tool calls in context_only mode", () => {
    const out = Policy.decide({
      profile: "strict",
      permission: "usar-mcp_azure_get_work_item",
      pattern: "*",
      risk: "medium",
      metadata: { intent: "context_only" },
    })
    expect(out?.action).toBe("deny")
    expect(out?.rule).toBe("intent_gating_context_only")
  })

  test("asks in strict profile when intent is not execute", () => {
    const out = Policy.decide({
      profile: "strict",
      permission: "webfetch",
      pattern: "https://example.com",
      risk: "medium",
      metadata: { intent: "unknown" },
    })
    expect(out?.action).toBe("ask")
    expect(out?.rule).toBe("require_explain_before_execute")
  })

  test("context wording wins over commit keyword mention", () => {
    expect(Policy.infer("explica como funciona git commit y git push")).toBe("context_only")
  })

  test("detects short approval wording as execute", () => {
    expect(Policy.infer("go ahead and do it")).toBe("execute")
  })
})

describe("Policy.infer", () => {
  test("detects execute intent", () => {
    expect(Policy.infer("ejecuta el plan y aplica cambios")).toBe("execute")
  })

  test("detects context intent", () => {
    expect(Policy.infer("te comparti contexto, explicame primero")).toBe("context_only")
  })
})
