/**
 * Simple ASCII flow diagram renderer using unicode box-drawing characters.
 *
 * Usage:
 *   asciiDiagram({
 *     nodes: ["Client", "API Gateway", "Lambda", "DynamoDB"],
 *     edges: [
 *       [0, 1, "HTTPS"],
 *       [1, 2, "invoke"],
 *       [2, 3, "query"],
 *     ],
 *     direction: "LR",  // left-to-right (default) or "TB" (top-to-bottom)
 *   })
 */

export interface DiagramNode {
  label: string
}

export interface DiagramEdge {
  from: number
  to: number
  label?: string
}

export interface DiagramInput {
  nodes: string[]
  edges: [from: number, to: number, label?: string][]
  direction?: "LR" | "TB"
  title?: string
}

const BOX = {
  tl: "┌",
  tr: "┐",
  bl: "└",
  br: "┘",
  h: "─",
  v: "│",
  arrow_r: "▶",
  arrow_d: "▼",
  arrow_l: "◀",
  arrow_u: "▲",
} as const

function box(label: string, padding = 1): string[] {
  const pad = " ".repeat(padding)
  const inner = `${pad}${label}${pad}`
  const width = inner.length + 2
  return [
    BOX.tl + BOX.h.repeat(width - 2) + BOX.tr,
    BOX.v + inner + BOX.v,
    BOX.bl + BOX.h.repeat(width - 2) + BOX.br,
  ]
}

function hArrow(label?: string, length = 6): string {
  if (label) {
    const dashes = Math.max(2, length - label.length - 2)
    const left = Math.floor(dashes / 2)
    const right = dashes - left
    return BOX.h.repeat(left) + ` ${label} ` + BOX.h.repeat(right) + BOX.arrow_r
  }
  return BOX.h.repeat(length - 1) + BOX.arrow_r
}

function vArrow(label?: string, length = 3): string[] {
  const lines: string[] = []
  for (let i = 0; i < length - 1; i++) {
    lines.push(BOX.v)
  }
  if (label) {
    lines.splice(Math.floor(lines.length / 2), 0, label)
  }
  lines.push(BOX.arrow_d)
  return lines
}

function renderLR(input: DiagramInput): string {
  const boxes = input.nodes.map((n) => box(n))
  const maxBoxHeight = Math.max(...boxes.map((b) => b.length))

  // Build adjacency: for each node, find outgoing edges
  const edgeMap = new Map<number, { to: number; label?: string }>()
  for (const [from, to, label] of input.edges) {
    edgeMap.set(from, { to, label })
  }

  // Sort nodes by edge order (simple: just use input order)
  const lines: string[] = Array(maxBoxHeight).fill("")
  const midRow = Math.floor(maxBoxHeight / 2)

  for (let i = 0; i < input.nodes.length; i++) {
    const b = boxes[i]
    // Pad box vertically to maxBoxHeight
    const topPad = Math.floor((maxBoxHeight - b.length) / 2)
    for (let row = 0; row < maxBoxHeight; row++) {
      const boxRow = row - topPad
      if (boxRow >= 0 && boxRow < b.length) {
        lines[row] += b[boxRow]
      } else {
        lines[row] += " ".repeat(b[0].length)
      }
    }

    // Add arrow if there's an edge from this node
    const edge = edgeMap.get(i)
    if (edge && edge.to === i + 1) {
      const arrow = hArrow(edge.label)
      for (let row = 0; row < maxBoxHeight; row++) {
        if (row === midRow) {
          lines[row] += arrow
        } else {
          lines[row] += " ".repeat(arrow.length)
        }
      }
    } else if (edge) {
      // Non-sequential edge — still draw arrow for simplicity
      const arrow = hArrow(edge.label)
      for (let row = 0; row < maxBoxHeight; row++) {
        if (row === midRow) {
          lines[row] += arrow
        } else {
          lines[row] += " ".repeat(arrow.length)
        }
      }
    }
  }

  return lines.join("\n")
}

function renderTB(input: DiagramInput): string {
  const boxes = input.nodes.map((n) => box(n))
  const maxBoxWidth = Math.max(...boxes.map((b) => b[0].length))
  const lines: string[] = []

  const edgeMap = new Map<number, { to: number; label?: string }>()
  for (const [from, to, label] of input.edges) {
    edgeMap.set(from, { to, label })
  }

  for (let i = 0; i < input.nodes.length; i++) {
    const b = boxes[i]
    const leftPad = Math.floor((maxBoxWidth - b[0].length) / 2)
    for (const row of b) {
      lines.push(" ".repeat(leftPad) + row)
    }

    const edge = edgeMap.get(i)
    if (edge) {
      const arrow = vArrow(edge.label)
      const arrowPad = Math.floor(maxBoxWidth / 2)
      for (const aRow of arrow) {
        lines.push(" ".repeat(arrowPad) + aRow)
      }
    }
  }

  return lines.join("\n")
}

// ─── Table renderer ───

export interface TableInput {
  headers: string[]
  rows: string[][]
  title?: string
  align?: ("left" | "right" | "center")[]
}

export function asciiTable(input: TableInput): string {
  const { headers, rows, title, align } = input
  const cols = headers.length

  // Calculate column widths based on content
  const widths: number[] = headers.map((h) => h.length)
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const cell = row[i] ?? ""
      widths[i] = Math.max(widths[i], cell.length)
    }
  }

  const pad = (text: string, width: number, alignment?: "left" | "right" | "center") => {
    const diff = width - text.length
    if (diff <= 0) return text
    const a = alignment ?? "left"
    if (a === "right") return " ".repeat(diff) + text
    if (a === "center") {
      const left = Math.floor(diff / 2)
      return " ".repeat(left) + text + " ".repeat(diff - left)
    }
    return text + " ".repeat(diff)
  }

  const formatRow = (cells: string[]) => {
    return (
      BOX.v +
      " " +
      cells
        .map((cell, i) => pad(cell, widths[i], align?.[i]))
        .join(" " + BOX.v + " ") +
      " " +
      BOX.v
    )
  }

  const separator = (left: string, mid: string, right: string) => {
    return left + widths.map((w) => BOX.h.repeat(w + 2)).join(mid) + right
  }

  const result: string[] = []

  if (title) {
    result.push(title)
    result.push("─".repeat(title.length))
    result.push("")
  }

  result.push(separator(BOX.tl, "┬", BOX.tr))
  result.push(formatRow(headers))
  result.push(separator("├", "┼", "┤"))
  for (const row of rows) {
    // Pad row to have enough columns
    const padded = [...row]
    while (padded.length < cols) padded.push("")
    result.push(formatRow(padded))
  }
  result.push(separator(BOX.bl, "┴", BOX.br))

  return result.join("\n")
}

export function asciiDiagram(input: DiagramInput): string {
  const result: string[] = []

  if (input.title) {
    result.push(input.title)
    result.push("─".repeat(input.title.length))
    result.push("")
  }

  const dir = input.direction ?? "LR"
  if (dir === "TB") {
    result.push(renderTB(input))
  } else {
    result.push(renderLR(input))
  }

  return result.join("\n")
}
