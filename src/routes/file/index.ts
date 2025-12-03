import { OpenAPIHono } from "@hono/zod-openapi";
import { getFileRoute } from "./file.route.js";
import { getFilePath } from "@/services/file.service.js";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { stream } from "hono/streaming";
import path from "node:path";

const app = new OpenAPIHono();

app.openapi(getFileRoute, async (c) => {
  const { filename } = c.req.valid("param");
  const filepath = getFilePath(filename);

  try {
    await fs.access(filepath);

    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".pdf") contentType = "application/pdf";
    if (ext === ".txt") contentType = "text/plain";

    c.header("Content-Type", contentType);

    return stream(c, async (stream) => {
      const fileStream = createReadStream(filepath);
      for await (const chunk of fileStream) {
        await stream.write(chunk);
      }
    });
  } catch (_error) {
    return c.json({ error: "File not found" }, 404);
  }
});

export default app;
