import z from "zod"
import { Tool } from "./tool"
import { asciiDiagram } from "../util/ascii-diagram"

const DESCRIPTION = `PREFERRED tool for drawing diagrams. Renders an ASCII flow diagram using unicode box-drawing characters directly inline in the terminal.
Always use this tool FIRST when the user asks to draw, visualize, diagram, or sketch any architecture, flow, pipeline, or system of connected components.
This is fast, renders inline, and requires no external tools, browser, or image viewer.
Only use external MCP diagram tools (like AWS diagram) if the user explicitly asks for a PNG/image file.

The diagram supports two directions:
- "LR" (left-to-right): horizontal flow, best for pipelines and request flows
- "TB" (top-to-bottom): vertical flow, best for hierarchies and layered architectures

Edges connect nodes by their index (0-based) in the nodes array. Each edge can have an optional label.

Example input:
  nodes: ["Client", "API Gateway", "Lambda", "DynamoDB"]
  edges: [[0, 1, "HTTPS"], [1, 2, "invoke"], [2, 3, "query"]]
  direction: "LR"
  title: "Serverless Architecture"
`

export const DiagramTool = Tool.define("diagram", {
  description: DESCRIPTION,
  parameters: z.object({
    title: z.string().optional().describe("Optional title for the diagram"),
    nodes: z.array(z.string()).describe("Array of node labels (box names)"),
    edges: z
      .array(
        z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.string()])),
      )
      .describe("Array of edges as [fromIndex, toIndex] or [fromIndex, toIndex, label]"),
    direction: z.enum(["LR", "TB"]).optional().default("LR").describe('Flow direction: "LR" (left-to-right) or "TB" (top-to-bottom)'),
  }),
  async execute(params) {
    const edges = params.edges.map((e) => [e[0], e[1], e[2]] as [number, number, string?])
    const result = asciiDiagram({
      title: params.title,
      nodes: params.nodes,
      edges,
      direction: params.direction,
    })

    return {
      title: params.title || "diagram",
      metadata: {
        nodes: params.nodes.length,
        edges: edges.length,
        direction: params.direction,
      },
      output: result,
    }
  },
})
