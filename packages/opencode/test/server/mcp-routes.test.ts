import { beforeEach, describe, expect, mock, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"

const projectRoot = path.join(__dirname, "../..")

const statusMock = mock(async () => ({
  "usar-mcp": { status: "connected" },
  other: { status: "connected" },
}))
const toolsMock = mock(async () => ({
  usar_mcp_alpha: {
    execute: mock(async () => ({
      content: [{ type: "text", text: "alpha output" }],
    })),
  },
  other_beta: {
    execute: mock(async () => ({
      content: [{ type: "text", text: "beta output" }],
    })),
  },
}))

mock.module("../../src/mcp", () => ({
  MCP: {
    status: statusMock,
    tools: toolsMock,
    Status: { parse: (x: unknown) => x },
  },
}))

describe("mcp routes", () => {
  beforeEach(() => {
    statusMock.mockClear()
    toolsMock.mockClear()
  })

  test("lists only local MCP tools for scope=local", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const app = Server.Default()
        const response = await app.request("/mcp/tools?scope=local")
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual([])
      },
    })
  })

  test("returns flattened output for mcp call", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const app = Server.Default()
        const response = await app.request("/mcp/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "usar_mcp_alpha", args: { id: 1 } }),
        })
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ output: "alpha output" })
      },
    })
  })

  test("returns 400 for unknown mcp tool", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const app = Server.Default()
        const response = await app.request("/mcp/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "missing_tool" }),
        })
        expect(response.status).toBe(400)
      },
    })
  })
})
