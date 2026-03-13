import { Instance } from "@/project/instance"
import { MCP } from "@/mcp"

export namespace AzureEvidence {
  type Text = { type: "text"; text?: string }
  type Res = { type: "resource"; resource?: { text?: string } }

  export interface BugView {
    bug_id: number
    baseline: string
    updates: string
    changesets: string
    evidence_map: string
  }

  function text(input: unknown) {
    if (!input || typeof input !== "object") return ""
    const value = input as {
      content?: Array<Text | Res>
      structuredContent?: Record<string, unknown>
    }
    const parts = (value.content ?? [])
      .flatMap((item) => {
        if (item.type === "text" && item.text) return [item.text]
        if (item.type === "resource" && item.resource?.text) return [item.resource.text]
        return []
      })
      .filter(Boolean)
    if (parts.length > 0) return parts.join("\n\n")
    return JSON.stringify(value.structuredContent ?? input, null, 2)
  }

  async function call(tool: string, args: Record<string, unknown>) {
    const item = (await MCP.tools())[tool]
    if (!item?.execute) {
      throw new Error(`MCP tool not found: ${tool}`)
    }
    const out = await item.execute(args, {
      messages: [],
      abortSignal: AbortSignal.timeout(30_000),
      toolCallId: `azure-evidence-${Date.now()}`,
    })
    return text(out)
  }

  export async function bug(id: number): Promise<BugView> {
    const [baseline, updates, changesets] = await Promise.all([
      call("usar-mcp_azure_get_work_item", { work_item_id: id, mode: "compact" }),
      call("usar-mcp_azure_get_work_item_updates", { work_item_id: id, summary_only: true }),
      call("usar-mcp_azure_get_bug_changesets", { bug_id: id }),
    ])

    const evidence_map = [
      `Bug ${id}`,
      "- baseline: loaded",
      "- updates: loaded",
      "- changesets: loaded",
    ].join("\n")

    return {
      bug_id: id,
      baseline,
      updates,
      changesets,
      evidence_map,
    }
  }
}
