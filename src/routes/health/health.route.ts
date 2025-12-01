import { createRoute } from "@hono/zod-openapi";
import { HealthAuthSchema, HealthSchema } from "./health.schema.js";
import {
  betterAuthSessionMiddleware,
  UnauthorizedSchema,
} from "@/middlewares/betterAuthMiddleware.js";
import { auth } from "@/utils/better-auth.js";

export const healthRoute = createRoute({
  tags: ["Health"],
  method: "get",
  path: "/",
  description: "Check for the health of the service and database connection",
  summary: "of the service without authentication",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
      description: "health without authorization check",
    },
  },
});

export const healthAuthRoute = createRoute({
  tags: ["Health"],
  method: "get",
  path: "/auth",
  description: "Check for the health of the service and database connection",
  summary: "of the service with authentication",
  security: [{ jwtCookie: [] }] as const,
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthAuthSchema,
        },
      },
      description: "health with authorization check",
    },
    401: {
      content: {
        "application/json": {
          schema: UnauthorizedSchema,
        },
      },
      description: "Authorization failed",
    },
  },
});
