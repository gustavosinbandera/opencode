import { describe, expect, test } from "bun:test"
import { Capability } from "./capability"

describe("Capability.resolve", () => {
  test("classifies native low-risk read tools", () => {
    const out = Capability.resolve("read")
    expect(out.source).toBe("native")
    expect(out.risk).toBe("low")
    expect(out.defaultAction).toBe("allow")
  })

  test("classifies native high-risk write tools", () => {
    const out = Capability.resolve("apply_patch")
    expect(out.source).toBe("native")
    expect(out.risk).toBe("high")
    expect(out.defaultAction).toBe("ask")
  })

  test("classifies MCP tools by prefix", () => {
    const out = Capability.resolve("usar-mcp_azure_get_work_item")
    expect(out.source).toBe("mcp")
    expect(out.risk).toBe("low")
    expect(out.defaultAction).toBe("allow")
  })

  test("keeps mutating MCP tools guarded", () => {
    const out = Capability.resolve("usar-mcp_clickup_create_task")
    expect(out.source).toBe("mcp")
    expect(out.risk).toBe("medium")
    expect(out.defaultAction).toBe("ask")
  })

  test("falls back to unknown classification", () => {
    const out = Capability.resolve("custom_unmapped_tool")
    expect(out.source).toBe("unknown")
    expect(out.risk).toBe("high")
    expect(out.defaultAction).toBe("ask")
  })
})
