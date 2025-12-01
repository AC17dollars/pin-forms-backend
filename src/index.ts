import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
// import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { cLogger } from "@/utils/logger.js";
import env from "@/utils/env.js";

import { auth } from "@/utils/better-auth.js";
import { connectDB, disconnectDB } from "@/db/mongo.js";
import { getLocalIPs } from "@/utils/ip-address.js";

// Import other routes apps
import healthApp from "@/routes/health/index.js";
import templateApp from "@/routes/template/index.js";
import formApp from "@/routes/form/index.js";

// Main Hono instance
cLogger.debug("Creating the base OpenAPIHono app...");
const app = new OpenAPIHono();

// API Hono instance
cLogger.debug("Creating the API OpenAPIHono app...");
const api = new OpenAPIHono();

// Middlewares
cLogger.debug("Adding middlewares to the base app...");
app.use(logger(cLogger.info));
// app.use(cors({ origin: "*" }));
app.get("/", (c) => {
  return c.redirect("/scalar");
});

// Add other routes apps
cLogger.debug("Adding other routes apps to the API app...");
api.on(["POST", "GET"], "/auth/*", (c) => {
  cLogger.debug(`Auth handler called for ${c.req.path}`);
  return auth.handler(c.req.raw);
});
api.route("/health", healthApp);
api.route("/template", templateApp);
api.route("/form", formApp);

// Use /api prefix for all routes
cLogger.debug("Adding API routes to the base app...");
app.route("/api", api);

// OpenAPI docs
cLogger.debug("Adding OpenAPI docs to the base app...");
const localIP = getLocalIPs();
app.openAPIRegistry.registerComponent("securitySchemes", "jwtHeader", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token to be used as Bearer token in Authorization header",
});
app.openAPIRegistry.registerComponent("securitySchemes", "jwtCookie", {
  type: "apiKey",
  name: "better-auth.session_token",
  in: "cookie",
  description: "Better Auth session token stored in cookie",
});

app.doc31("/doc", {
  openapi: "3.1.1",
  info: {
    version: "1.0.0",
    title: "GIS Form Backend API",
    description:
      "A backend api for creating form templates and data as per templates",
  },
  servers: [
    ...localIP.ipv4.map((ip) => ({
      url: `http://${ip}:${env.PORT}`,
      description: "Local IPv4 server",
    })),
    ...localIP.ipv6.map((ip) => ({
      url: `http://[${ip}]:${env.PORT}`,
      description: "Local IPv6 server",
    })),
    { url: `http://localhost:${env.PORT}`, description: "Local server" },
  ],
});

// Scalar UI
cLogger.debug("Adding Scalar UI to the base app...");
app.get(
  "/scalar",
  Scalar({
    theme: "bluePlanet",
    sources: [
      {
        url: "/doc",
        title: "API Docs",
      },
      {
        url: "/api/auth/open-api/generate-schema",
        title: "Auth Docs",
      },
    ],
  })
);

// Connect to database
connectDB()
  .then()
  .catch((err: unknown) => {
    cLogger.error("Failed to connect to MongoDB: ", err);
  });

// Node server
cLogger.debug("Starting the server...");
serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    cLogger.info("Server started successfully");
    cLogger.debug("Local Servers:");
    cLogger.info(`🌐 Server @\x1b[34mhttp://localhost:${info.port}\x1b[0m`);
    cLogger.info(`🌐 Server @\x1b[34mhttp://127.0.0.1:${info.port}\x1b[0m`);
    cLogger.info(`🌐 Server @\x1b[34mhttp://[::1]:${info.port}\x1b[0m\n`);
    cLogger.debug("External Servers:");
    localIP.ipv4.forEach((ip) => {
      cLogger.info(`🌐 Server @\x1b[34mhttp://${ip}:${info.port}\x1b[0m`);
    });
    localIP.ipv6.forEach((ip) => {
      cLogger.info(`🌐 Server @\x1b[34mhttp://[${ip}]:${info.port}\x1b[0m`);
    });
  }
);

// Shutdown gracefully
process.on("SIGINT", async () => {
  console.log("an you not SIGINT");
  cLogger.debug("Received SIGINT, closing DB connection...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("an you not SIGTERM");
  cLogger.debug("Received SIGTERM, closing DB connection...");
  await disconnectDB();
  process.exit(0);
});
