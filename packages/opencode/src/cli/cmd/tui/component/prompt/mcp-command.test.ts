import { describe, expect, test } from "bun:test"
import { resolveMcpArgs } from "./mcp-command"

describe("resolveMcpArgs", () => {
  test("parses json args", () => {
    const out = resolveMcpArgs("tool", '{"work_item_id":123,"mode":"analysis"}', undefined)
    expect(out).toEqual({ args: { work_item_id: 123, mode: "analysis" } })
  })

  test("parses key value args", () => {
    const out = resolveMcpArgs("tool", "work_item_id=123 mode=analysis", undefined)
    expect(out).toEqual({ args: { work_item_id: 123, mode: "analysis" } })
  })

  test("requires valid mode when schema demands it", () => {
    const out = resolveMcpArgs(
      "tool",
      "123",
      { properties: { work_item_id: { type: "integer" }, mode: { enum: ["analysis", "solution"] } }, required: ["work_item_id", "mode"] },
    )
    expect(out).toEqual({ error: "Missing required mode. Use `/mcp-tools tool 123 <analysis|solution>` or JSON args." })
  })

  test("infers id and compact mode when optional", () => {
    const out = resolveMcpArgs(
      "tool",
      "123",
      { properties: { work_item_id: { type: "integer" }, mode: { enum: ["compact", "full"] } }, required: ["work_item_id"] },
    )
    expect(out).toEqual({ args: { work_item_id: 123, mode: "compact" } })
  })
})
