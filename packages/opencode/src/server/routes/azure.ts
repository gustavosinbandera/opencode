import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import z from "zod"
import { AzureEvidence } from "@/azure/evidence"
import { errors } from "../error"
import { lazy } from "@/util/lazy"

export const AzureRoutes = lazy(() =>
  new Hono().post(
    "/evidence/bug",
    describeRoute({
      summary: "Build Azure bug evidence view",
      description: "Return a bug-centric evidence view using Azure MCP tools for baseline, updates, and changesets.",
      operationId: "azure.evidence.bug",
      responses: {
        200: {
          description: "Bug evidence view",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  bug_id: z.number(),
                  baseline: z.string(),
                  updates: z.string(),
                  changesets: z.string(),
                  evidence_map: z.string(),
                }),
              ),
            },
          },
        },
        ...errors(400),
      },
    }),
    validator(
      "json",
      z.object({
        bug_id: z.number(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json")
      return c.json(await AzureEvidence.bug(body.bug_id))
    },
  ),
)
