import { Bus } from "@/bus"
import { BusEvent } from "@/bus/bus-event"
import { Config } from "@/config/config"
import { SessionID, MessageID } from "@/session/schema"
import { PermissionID } from "./schema"
import { Instance } from "@/project/instance"
import { Database, eq } from "@/storage/db"
import { PermissionTable } from "@/session/session.sql"
import { fn } from "@/util/fn"
import { Log } from "@/util/log"
import { ProjectID } from "@/project/schema"
import { Wildcard } from "@/util/wildcard"
import { Capability } from "./capability"
import { Flag } from "@/flag/flag"
import os from "os"
import z from "zod"

export namespace PermissionNext {
  const log = Log.create({ service: "permission" })
  // Force debug logging
  if (typeof process !== "undefined" && !process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = "DEBUG"
  }
  const PRIORITY: Record<Action, number> = {
    allow: 0,
    ask: 1,
    deny: 2,
  }

  function tighten(base: Action, override?: Action): Action {
    if (!override) return base
    return PRIORITY[override] > PRIORITY[base] ? override : base
  }

  function expand(pattern: string): string {
    if (pattern.startsWith("~/")) return os.homedir() + pattern.slice(1)
    if (pattern === "~") return os.homedir()
    if (pattern.startsWith("$HOME/")) return os.homedir() + pattern.slice(5)
    if (pattern.startsWith("$HOME")) return os.homedir() + pattern.slice(5)
    return pattern
  }

  export const Action = z.enum(["allow", "deny", "ask"]).meta({
    ref: "PermissionAction",
  })
  export type Action = z.infer<typeof Action>

  export const Rule = z
    .object({
      permission: z.string(),
      pattern: z.string(),
      action: Action,
    })
    .meta({
      ref: "PermissionRule",
    })
  export type Rule = z.infer<typeof Rule>

  export const Ruleset = Rule.array().meta({
    ref: "PermissionRuleset",
  })
  export type Ruleset = z.infer<typeof Ruleset>

  export function fromConfig(permission: Config.Permission) {
    const ruleset: Ruleset = []
    for (const [key, value] of Object.entries(permission)) {
      if (typeof value === "string") {
        ruleset.push({
          permission: key,
          action: value,
          pattern: "*",
        })
        continue
      }
      ruleset.push(
        ...Object.entries(value).map(([pattern, action]) => ({ permission: key, pattern: expand(pattern), action })),
      )
    }
    return ruleset
  }

  export function merge(...rulesets: Ruleset[]): Ruleset {
    return rulesets.flat()
  }

  export const Request = z
    .object({
      id: PermissionID.zod,
      sessionID: SessionID.zod,
      permission: z.string(),
      patterns: z.string().array(),
      metadata: z.record(z.string(), z.any()),
      always: z.string().array(),
      tool: z
        .object({
          messageID: MessageID.zod,
          callID: z.string(),
        })
        .optional(),
    })
    .meta({
      ref: "PermissionRequest",
    })

  export type Request = z.infer<typeof Request>

  export const Reply = z.enum(["once", "always", "reject"])
  export type Reply = z.infer<typeof Reply>

  export const Approval = z.object({
    projectID: ProjectID.zod,
    patterns: z.string().array(),
  })

  export const Event = {
    Asked: BusEvent.define("permission.asked", Request),
    Evaluated: BusEvent.define(
      "permission.evaluated",
      z.object({
        sessionID: z.string(),
        permission: z.string(),
        pattern: z.string(),
        action: Action,
        source: z.enum(["ruleset", "capability_default", "unknown_default", "policy"]),
        policy: z
          .object({
            rule: z.string(),
            reason: z.string(),
          })
          .optional(),
        capability: z.object({
          id: z.string(),
          source: z.enum(["native", "mcp", "unknown"]),
          risk: z.enum(["low", "medium", "high", "critical"]),
          defaultAction: Action,
        }),
      }),
    ),
    Replied: BusEvent.define(
      "permission.replied",
      z.object({
        sessionID: SessionID.zod,
        requestID: PermissionID.zod,
        reply: Reply,
      }),
    ),
  }

  interface PendingEntry {
    info: Request
    resolve: () => void
    reject: (e: any) => void
  }

  const state = Instance.state(() => {
    const projectID = Instance.project.id
    const row = Database.use((db) =>
      db.select().from(PermissionTable).where(eq(PermissionTable.project_id, projectID)).get(),
    )
    const stored = row?.data ?? ([] as Ruleset)
    log.debug("loading permissions from DB", {
      projectID,
      hasRow: !!row,
      storedCount: stored.length,
      dbPath: Database.Path,
    })

    log.info("loading permissions from DB", {
      projectID,
      hasRow: !!row,
      storedCount: stored.length,
      dbPath: Database.Path,
    })

    return {
      pending: new Map<PermissionID, PendingEntry>(),
      approved: stored,
      projectID,
    }
  })

  export const ask = fn(
    Request.partial({ id: true }).extend({
      ruleset: Ruleset,
    }),
    async (input) => {
      const s = await state()
      const { ruleset, ...request } = input
      log.debug("permission ask", {
        permission: request.permission,
        patterns: request.patterns,
        approvedCount: s.approved.length,
      })
      for (const pattern of request.patterns ?? []) {
        const rule = evaluate(request.permission, pattern, ruleset, s.approved)
        const action = rule.action
        const source = rule.source
        log.debug("permission evaluation", {
          permission: request.permission,
          pattern,
          action,
          source,
          capability: rule.capability.id,
          defaultAction: rule.capability.defaultAction,
        })
        log.info("evaluated", {
          permission: request.permission,
          pattern,
          action,
          source,
          capability: rule.capability,
        })
        Bus.publish(Event.Evaluated, {
          sessionID: request.sessionID,
          permission: request.permission,
          pattern,
          action,
          source,
          capability: {
            id: rule.capability.id,
            source: rule.capability.source,
            risk: rule.capability.risk,
            defaultAction: rule.capability.defaultAction,
          },
        })
        if (action === "deny")
          throw new DeniedError(
            ruleset.filter((r) => Wildcard.match(request.permission, r.permission)),
            source === "ruleset"
              ? undefined
              : `Tool call denied by capability policy (${rule.capability.id}, source=${source}).`,
          )
        if (action === "ask") {
          const id = input.id ?? PermissionID.ascending()
          return new Promise<void>((resolve, reject) => {
            const info: Request = {
              id,
              ...request,
            }
            s.pending.set(id, {
              info,
              resolve,
              reject,
            })
            Bus.publish(Event.Asked, info)
          })
        }
        if (action === "allow") continue
      }
    },
  )

  export const reply = fn(
    z.object({
      requestID: PermissionID.zod,
      reply: Reply,
      message: z.string().optional(),
    }),
    async (input) => {
      const s = await state()
      const existing = s.pending.get(input.requestID)
      if (!existing) return
      s.pending.delete(input.requestID)
      Bus.publish(Event.Replied, {
        sessionID: existing.info.sessionID,
        requestID: existing.info.id,
        reply: input.reply,
      })
      if (input.reply === "reject") {
        existing.reject(input.message ? new CorrectedError(input.message) : new RejectedError())
        // Reject all other pending permissions for this session
        const sessionID = existing.info.sessionID
        for (const [id, pending] of s.pending) {
          if (pending.info.sessionID === sessionID) {
            s.pending.delete(id)
            Bus.publish(Event.Replied, {
              sessionID: pending.info.sessionID,
              requestID: pending.info.id,
              reply: "reject",
            })
            pending.reject(new RejectedError())
          }
        }
        return
      }
      if (input.reply === "once") {
        existing.resolve()
        return
      }
      if (input.reply === "always") {
        for (const pattern of existing.info.always) {
          const already = s.approved.some(
            (rule) =>
              rule.permission === existing.info.permission && rule.pattern === pattern && rule.action === "allow",
          )
          if (!already) {
            s.approved.push({
              permission: existing.info.permission,
              pattern,
              action: "allow",
            })
          }
        }

        existing.resolve()

        const sessionID = existing.info.sessionID
        for (const [id, pending] of s.pending) {
          if (pending.info.sessionID !== sessionID) continue
          const ok = pending.info.patterns.every(
            (pattern) => evaluate(pending.info.permission, pattern, s.approved).action === "allow",
          )
          if (!ok) continue
          s.pending.delete(id)
          Bus.publish(Event.Replied, {
            sessionID: pending.info.sessionID,
            requestID: pending.info.id,
            reply: "always",
          })
          pending.resolve()
        }

        Database.use((db) =>
          db
            .insert(PermissionTable)
            .values({
              project_id: s.projectID,
              data: s.approved,
              time_created: Date.now(),
              time_updated: Date.now(),
            })
            .onConflictDoUpdate({
              target: PermissionTable.project_id,
              set: {
                data: s.approved,
                time_updated: Date.now(),
              },
            })
            .run(),
        )
        return
      }
    },
  )

  export type Evaluation = Rule & {
    source: "ruleset" | "capability_default" | "unknown_default" | "policy"
    capability: Capability.Info
  }

  export function evaluate(permission: string, pattern: string, ...rulesets: Ruleset[]): Evaluation {
    const merged = merge(...rulesets)
    log.info("evaluate", { permission, pattern, ruleset: merged })
    const match = merged.findLast(
      (rule) => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern),
    )
    if (match) {
      log.info("evaluate matched rule", {
        permission,
        pattern,
        rule: match,
        matchedPermission: Wildcard.match(permission, match.permission),
        matchedPattern: Wildcard.match(pattern, match.pattern),
      })
      return {
        ...match,
        source: "ruleset",
        capability: Capability.resolve(permission),
      }
    }

    const capability = Capability.resolve(permission)
    log.info("evaluate no match, using capability", {
      permission,
      pattern,
      capability: capability.id,
      defaultAction: capability.defaultAction,
    })
    if (capability.source === "unknown" && Flag.OPENCODE_EXPERIMENTAL_CAPABILITY_DENY_UNKNOWN) {
      return {
        permission,
        pattern: "*",
        action: "deny",
        source: "unknown_default",
        capability: {
          ...capability,
          defaultAction: "deny",
        },
      }
    }

    return {
      permission,
      pattern: "*",
      action: capability.defaultAction,
      source: capability.source === "unknown" ? "unknown_default" : "capability_default",
      capability,
    }
  }

  const EDIT_TOOLS = ["edit", "write", "patch", "multiedit", "apply_patch"]

  export function disabled(tools: string[], ruleset: Ruleset): Set<string> {
    const result = new Set<string>()
    for (const tool of tools) {
      const permission = EDIT_TOOLS.includes(tool) ? "edit" : tool

      const rule = ruleset.findLast((r) => Wildcard.match(permission, r.permission))
      if (!rule) continue
      if (rule.pattern === "*" && rule.action === "deny") result.add(tool)
    }
    return result
  }

  /** User rejected without message - halts execution */
  export class RejectedError extends Error {
    constructor() {
      super(`The user rejected permission to use this specific tool call.`)
    }
  }

  /** User rejected with message - continues with guidance */
  export class CorrectedError extends Error {
    constructor(message: string) {
      super(`The user rejected permission to use this specific tool call with the following feedback: ${message}`)
    }
  }

  /** Auto-rejected by config rule - halts execution */
  export class DeniedError extends Error {
    constructor(
      public readonly ruleset: Ruleset,
      detail?: string,
    ) {
      super(
        detail ??
          `The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules ${JSON.stringify(ruleset)}`,
      )
    }
  }

  export async function list() {
    const s = await state()
    return Array.from(s.pending.values(), (x) => x.info)
  }
}
