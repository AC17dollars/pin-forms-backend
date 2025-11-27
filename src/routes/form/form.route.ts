import { createRoute } from "@hono/zod-openapi";
import {
  CreateFormSchema,
  FormListSchema,
  FormResponseSchema,
  DeleteFormParamSchema,
  UpdateFormSchema,
} from "./form.schema.js";

import {
  ZodValidationErrorSchema,
  InternalServerErrorSchema,
} from "@/utils/validation.schema.js";
import {
  betterAuthSessionMiddleware,
  UnauthorizedSchema,
} from "@/middlewares/betterAuthMiddleware.js";
import { auth } from "@/utils/better-auth.js";

export const createFormRoute = createRoute({
  tags: ["Forms"],
  method: "post",
  path: "/create",
  summary: "Create a new Form",
  description: "Submit a new form based on a template.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateFormSchema,
        },
      },
      description: "Form submission data.",
    },
  },
  responses: {
    201: {
      description: "Form created successfully",
      content: {
        "application/json": {
          schema: FormResponseSchema,
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
    404: {
      description: "Template not found",
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

export const listFormsRoute = createRoute({
  tags: ["Forms"],
  method: "get",
  path: "/list",
  summary: "List Forms",
  description: "Retrieve all submitted forms.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  responses: {
    200: {
      description: "List of forms",
      content: {
        "application/json": {
          schema: FormListSchema,
        },
      },
    },
    204: {
      description: "No forms found",
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

export const updateFormRoute = createRoute({
  tags: ["Forms"],
  method: "put",
  path: "/{id}",
  summary: "Update a Form",
  description: "Update an existing form by ID.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  request: {
    params: DeleteFormParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: UpdateFormSchema,
        },
      },
      description: "Updated form data.",
    },
  },
  responses: {
    200: {
      description: "Form updated successfully",
      content: {
        "application/json": {
          schema: FormResponseSchema,
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
    404: {
      description: "Form not found",
      content: {
        "application/json": {
          schema: InternalServerErrorSchema,
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

export const deleteFormRoute = createRoute({
  tags: ["Forms"],
  method: "delete",
  path: "/{id}",
  summary: "Delete a Form",
  description: "Delete a form by ID.",
  middleware: [betterAuthSessionMiddleware(auth)] as const,
  security: [{ jwtHeader: [] }, { jwtCookie: [] }] as const,
  request: {
    params: DeleteFormParamSchema,
  },
  responses: {
    204: {
      description: "Form deleted successfully",
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedSchema,
        },
      },
    },
    404: {
      description: "Form not found",
      content: {
        "application/json": {
          schema: InternalServerErrorSchema,
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
