import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoute, healthAuthRoute } from "./health.route.js";

const app = new OpenAPIHono();

import { db } from "@/db/connection.js";
import { cLogger } from "@/utils/logger.js";

app.openapi(healthRoute, async (c) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  try {
    await db.command({ ping: 1 });
    dbStatus = "connected";
  } catch (error) {
    cLogger.error("Health check failed: ", error);
    dbStatus = "disconnected";
  }

  return c.json({
    status: "ok" as "ok" | "error",
    checkedAt: new Date().toISOString(),
    database: dbStatus,
  });
});

app.openapi(healthAuthRoute, async (c) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  try {
    await db.command({ ping: 1 });
    dbStatus = "connected";
  } catch (error) {
    cLogger.error("Health check failed: ", error);
    dbStatus = "disconnected";
  }

  return c.json(
    {
      status: "ok" as "ok" | "error",
      checkedAt: new Date().toISOString(),
      database: dbStatus,
      authorization: "ok" as const,
    },
    200
  );
});

export default app;
