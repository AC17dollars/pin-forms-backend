import { createRoute, z } from "@hono/zod-openapi";

export const getFileRoute = createRoute({
  method: "get",
  path: "/{filename}",
  tags: ["Files"],
  request: {
    params: z.object({
      filename: z.string().openapi({ param: { name: "filename", in: "path" } }),
    }),
  },
  responses: {
    200: {
      description: "File content",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({ format: "binary" }),
        },
      },
    },
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});
