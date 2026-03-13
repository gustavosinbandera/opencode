export type ToolDetails = {
  id: string
  description?: string
  parameters?: unknown
}

export function summarizeToolParameters(parameters: unknown) {
  if (!parameters || typeof parameters !== "object") return "- none"
  const props = (parameters as { properties?: Record<string, { description?: string }> }).properties
  if (!props || Object.keys(props).length === 0) return "- none"
  return Object.entries(props)
    .slice(0, 8)
    .map(([name, config]) => `- ${name}${config?.description ? `: ${config.description}` : ""}`)
    .join("\n")
}

export function parseArg(value: string) {
  const text = value.trim()
  if (!text.length) return ""
  if (text === "true") return true
  if (text === "false") return false
  if (text === "null") return null
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1)
  }
  return text
}

export function parsePairs(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return
  if (!tokens.some((token) => token.includes("="))) return
  if (tokens.some((token) => !token.includes("="))) return
  const args: Record<string, unknown> = {}
  for (const token of tokens) {
    const index = token.indexOf("=")
    if (index <= 0) return
    const key = token.slice(0, index).trim()
    const value = token.slice(index + 1)
    if (!key.length) return
    args[key] = parseArg(value)
  }
  return args
}

export function parseJSON(text: string) {
  const value = text.trim()
  if (!value.startsWith("{") || !value.endsWith("}")) return
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return
    return parsed as Record<string, unknown>
  } catch {
    return
  }
}

export function legacyMcpArgs(tool: string, objective: string) {
  const id = Number(objective)
  if (!Number.isFinite(id)) return undefined
  if (tool === "usar-mcp_azure_get_work_item") {
    return {
      work_item_id: id,
      mode: "compact",
    }
  }
  if (tool === "usar-mcp_azure_bug_analysis_draft") {
    return {
      work_item_id: id,
      mode: "analysis",
    }
  }
  if (tool === "usar-mcp_azure_bug_solution_draft") {
    return {
      work_item_id: id,
      mode: "solution",
    }
  }
  if (tool.startsWith("usar-mcp_azure_")) {
    return {
      work_item_id: id,
    }
  }
  return undefined
}

export function resolveMcpArgs(tool: string, objective: string, schema: unknown) {
  const text = objective.trim()
  if (!text.length) return {}

  const json = parseJSON(text)
  if (json) return { args: json as Record<string, unknown> }

  const pairs = parsePairs(text)
  if (pairs) return { args: pairs }

  const root = schema && typeof schema === "object" ? (schema as Record<string, unknown>) : undefined
  const properties = root?.properties
  const props = properties && typeof properties === "object" ? (properties as Record<string, unknown>) : {}
  const required = new Set(Array.isArray(root?.required) ? root.required.filter((x) => typeof x === "string") : [])
  const keys = Object.keys(props)
  const parts = text.split(/\s+/).filter(Boolean)
  const id = Number(parts[0])

  if (!Number.isFinite(id)) {
    const legacy = legacyMcpArgs(tool, text)
    if (legacy) return { args: legacy }
    return {}
  }

  const numeric = (key: string) => {
    const info = props[key]
    if (!info || typeof info !== "object") return false
    const type = (info as { type?: string | string[] }).type
    if (!type) return true
    return Array.isArray(type) ? type.some((x) => x === "integer" || x === "number") : type === "integer" || type === "number"
  }

  const ids = keys.filter((key) => (key === "work_item_id" || key.endsWith("_id") || key === "id") && numeric(key))
  const req = ids.filter((key) => required.has(key))
  const idKey = ids.includes("work_item_id")
    ? "work_item_id"
    : req[0] || ids[0] || keys.find((key) => required.has(key) && numeric(key)) || keys.find((key) => numeric(key))

  if (!idKey) {
    const legacy = legacyMcpArgs(tool, text)
    if (legacy) return { args: legacy }
    return {}
  }

  const args: Record<string, unknown> = { [idKey]: id }
  const mode = props.mode
  const modeInfo = mode && typeof mode === "object" ? (mode as { enum?: unknown[] }) : undefined
  const enums = Array.isArray(modeInfo?.enum) ? modeInfo.enum.filter((x): x is string => typeof x === "string") : []
  const selected = parts[1]

  if (selected && enums.includes(selected)) {
    args.mode = selected
    return { args }
  }
  if (selected && mode && required.has("mode")) {
    return {
      error: `Invalid mode \`${selected}\`. Allowed: ${enums.join(", ") || "n/a"}.`,
    }
  }
  if (required.has("mode") && enums.length > 0) {
    return {
      error: `Missing required mode. Use \`/mcp-tools ${tool} ${id} <${enums.join("|")}>\` or JSON args.`,
    }
  }
  if (!required.has("mode") && enums.includes("compact")) {
    args.mode = "compact"
  }

  return { args }
}
