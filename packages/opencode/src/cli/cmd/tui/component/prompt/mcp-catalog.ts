type SDKLike = {
  client: {
    mcp: {
      tools(input: { scope: "local" }): Promise<{ data?: string[] }>
      status(): Promise<{ data?: Record<string, { status?: string }> }>
    }
    tool: {
      ids(): Promise<{ data?: string[] }>
    }
  }
}

export async function loadMcpToolIDs(sdk: SDKLike) {
  return sdk.client.mcp.tools({ scope: "local" }).then((x: { data?: string[] }) => (x.data ?? []) as string[]).catch(() => [] as string[])
}

export async function loadMcpDebugInfo(sdk: SDKLike) {
  const status = await sdk.client.mcp.status().then((x: { data?: Record<string, { status?: string }> }) => x.data ?? {}).catch(() => ({}))
  const direct = await sdk.client.mcp.tools({ scope: "local" }).then((x: { data?: string[] }) => x.data ?? []).catch(() => [])
  const configured = Object.keys(status)
  const connected = Object.entries(status)
    .filter(([, value]) => (value as { status?: string }).status === "connected")
    .map(([key]) => key)
  return {
    configured,
    connected,
    local: configured,
    direct,
  }
}

export async function loadNativeToolIDs(sdk: SDKLike) {
  const ids = await sdk.client.tool.ids().then((x: { data?: string[] }) => x.data ?? []).catch(() => [])
  const mcp = await loadMcpToolIDs(sdk)
  return ids.filter((id: string) => !mcp.includes(id))
}
