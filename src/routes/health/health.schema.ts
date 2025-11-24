import { z } from "@hono/zod-openapi";

export const HealthSchema = z
  .object({
    status: z.enum(["ok", "error"]),
    checkedAt: z.iso.datetime({ offset: true }),
    database: z.enum(["connected", "disconnected"]),
  })
  .openapi("HealthSchema");

export const HealthAuthSchema = HealthSchema.extend({
  authorization: z.literal("ok"),
}).openapi("HealthAuthSchema");
