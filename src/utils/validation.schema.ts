import { z } from "@hono/zod-openapi";

export const ZodValidationIssueSchema = z.object({
  code: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

export const ZodValidationErrorSchema = z
  .object({
    error: z.literal("ValidationError"),
    issues: z.array(ZodValidationIssueSchema),
  })
  .openapi("ZodValidationError");

export const InternalServerErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("InternalServerError");
