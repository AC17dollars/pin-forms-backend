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
        return c.json(
          { message: "Unauthorized! Please provide a valid token" },
          401
        );
      }
    } catch {
      c.set("user", null);
      c.set("session", null);
      return c.json({ error: "Internal Server Error" }, 500);
    }

    await next();
  });
}

export const UnauthorizedSchema = z
  .object({
    message: z.literal("Unauthorized! Please provide a valid token"),
  })
  .openapi({
    description: "Unauthorized Response",
    example: { message: "Unauthorized! Please provide a valid token" },
  });
