import { beforeEach, describe, expect, mock, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import z from "zod"

const projectRoot = path.join(__dirname, "../..")

const idsMock = mock(async () => ["read", "bash", "usar_mcp_alpha"])
const toolsMock = mock(async () => [
  {
    id: "read",
    description: "Read files",
    parameters: z.object({ filePath: z.string() }),
  },
])

mock.module("../../src/tool/registry", () => ({
  ToolRegistry: {
    ids: idsMock,
    tools: toolsMock,
  },
}))

describe("experimental tool routes", () => {
  beforeEach(() => {
    idsMock.mockClear()
    toolsMock.mockClear()
  })

  test("lists native and registered tool ids", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const app = Server.Default()
        const response = await app.request("/experimental/tool/ids")
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual(["read", "bash", "usar_mcp_alpha"])
      },
    })
  })

  test("lists tool metadata with parameter schema", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const app = Server.Default()
        const response = await app.request("/experimental/tool?provider=test&model=model")
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body[0].id).toBe("read")
        expect(body[0].description).toBe("Read files")
        expect(body[0].parameters).toBeTruthy()
      },
    })
  })
})
