import { createRoute } from "@hono/zod-openapi";
import {
  CreateTemplateSchema,
  TemplateListSchema,
  TemplateResponseSchema,
} from "./template.schema.js";

import {
  ZodValidationErrorSchema,
  InternalServerErrorSchema,
} from "@/utils/validation.schema.js";
import {
  betterAuthSessionMiddleware,
  UnauthorizedSchema,
} from "@/middlewares/betterAuthMiddleware.js";
import { auth } from "@/utils/better-auth.js";

export const createTemplateRoute = createRoute({
  tags: ["Templates"],
  method: "post",
  path: "/create",
  summary: "Create a new Template",
  description:
    "Create a map-based form template with dynamic fields. The 'place' field is added automatically.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTemplateSchema,
        },
      },
      description:
        "Template definition (excluding the required 'place' field).",
    },
  },
  responses: {
    201: {
      description: "Template created successfully",
      content: {
        "application/json": {
          schema: TemplateResponseSchema,
        },
      },
    },
    400: {
      description: "Zod validation error",
      content: {
        "application/json": {
          schema: ZodValidationErrorSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: InternalServerErrorSchema,
        },
      },
    },
  },
});

export const listTemplatesRoute = createRoute({
  tags: ["Templates"],
  method: "get",
  path: "/list",
  summary: "List Templates",
  description: "Retrieve all created templates.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  responses: {
    200: {
      description: "List of templates",
      content: {
        "application/json": {
          schema: TemplateListSchema,
        },
      },
    },
    204: {
      description: "No templates found",
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: InternalServerErrorSchema,
        },
      },
    },
  },
});
