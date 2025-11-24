import type { Context, Next } from "hono";
import type { Auth } from "better-auth";
import { z } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";

export function betterAuthSessionMiddleware(auth: Auth) {
  return createMiddleware<{
    Variables: {
      user: typeof auth.$Infer.Session.user | null;
      session: typeof auth.$Infer.Session.session | null;
    };
  }>(async (c: Context, next: Next) => {
    try {
      const result = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (result) {
        c.set("user", result.user);
        c.set("session", result.session);
      } else {
        c.set("user", null);
        c.set("session", null);
      }
    } catch {
      c.set("user", null);
      c.set("session", null);
    }

    await next();
  });
}

export const UnauthorizedSchema = z
  .object({
    message: z.enum(["No token provided", "Invalid token"]),
  })
  .openapi({
    description: "Unauthorized Response",
    example: { message: "No token provided" },
  });
