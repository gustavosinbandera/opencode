import { createResource, createMemo } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { MCP } from "@/mcp"
import { Config } from "@/config/config"

async function loadMcpToolIDs() {
  const direct = Object.keys(await MCP.tools().catch(() => ({})))
  if (direct.length > 0) return direct.sort((a, b) => a.localeCompare(b))

  const status = await MCP.status().catch(() => ({} as Awaited<ReturnType<typeof MCP.status>>))
  const configured = Object.keys((await Config.get().catch(() => ({ mcp: {} as Record<string, unknown> }))).mcp ?? {})
  const candidates = [...new Set([...Object.keys(status), ...configured])]

  await Promise.all(
    candidates.map(async (name) => {
      const state = status[name]
      if (!state || (state.status !== "connected" && state.status !== "disabled")) {
        await MCP.connect(name).catch(() => undefined)
      }
    }),
  )

  for (let i = 0; i < 3; i++) {
    const retried = Object.keys(await MCP.tools().catch(() => ({})))
    if (retried.length > 0) return retried.sort((a, b) => a.localeCompare(b))
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  return []
}

export function DialogTool(props: { onSelect: (toolID: string) => void }) {
  const [tools] = createResource(async () => loadMcpToolIDs())

  const options = createMemo<DialogSelectOption<string>[]>(() => {
    const list = tools() ?? []
    return list.map((id) => ({
      value: id,
      title: id,
      description: undefined,
    }))
  })

  return <DialogSelect title="Tools" options={options()} onSelect={(option) => props.onSelect(option.value)} />
}
