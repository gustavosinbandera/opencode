import z from "zod"
import { Tool } from "./tool"
import { asciiTable } from "../util/ascii-diagram"

const DESCRIPTION = `PREFERRED tool for rendering tables. Generates a perfectly aligned ASCII table using unicode box-drawing characters directly inline in the terminal.
Always use this tool when the user asks for a table, comparison, list of features, matrix, or any tabular data.
This tool guarantees perfect column alignment regardless of content length. Never draw tables manually in text — always use this tool instead.

Supports optional column alignment: "left" (default), "right", or "center".

Example input:
  headers: ["Name", "Status", "Priority"]
  rows: [["Feature A", "Done", "High"], ["Feature B", "In Progress", "Medium"]]
  title: "Project Status"
  align: ["left", "center", "right"]
`

export const TableTool = Tool.define("table", {
  description: DESCRIPTION,
  parameters: z.object({
    title: z.string().optional().describe("Optional title displayed above the table"),
    headers: z.array(z.string()).describe("Column header labels"),
    rows: z.array(z.array(z.string())).describe("Array of rows, each row is an array of cell values"),
    align: z
      .array(z.enum(["left", "right", "center"]))
      .optional()
      .describe('Optional alignment per column: "left", "right", or "center"'),
  }),
  async execute(params) {
    const result = asciiTable({
      title: params.title,
      headers: params.headers,
      rows: params.rows,
      align: params.align,
    })

    return {
      title: params.title || "table",
      metadata: {
        columns: params.headers.length,
        rows: params.rows.length,
      },
      output: result,
    }
  },
})
