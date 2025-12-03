import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Context, Next } from "hono";

vi.mock("../middlewares/betterAuthMiddleware.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../middlewares/betterAuthMiddleware.js")
    >();

  return {
    ...actual,
    betterAuthSessionMiddleware:
      () =>
      async (_c: Context, next: Next): Promise<void> => {
        await next();
      },
  };
});

import app from "../index.js";
import { db, connectDB, disconnectDB } from "@/db/connection.js";
import { ObjectId } from "mongodb";
import fs from "node:fs/promises";
import path from "node:path";

const TEST_STORAGE_DIR = "storage";

interface CreateFormResponse {
  data: {
    photo?: {
      type: string;
      url: string;
      filename: string;
    };
    [key: string]: unknown;
  };
  error?: string;
}

describe("File Upload and Serving", () => {
  let templateId: string;

  beforeAll(async () => {
    await connectDB();

    const template = {
      name: "Test Template",
      markerIcon: "test",
      fixedFields: [
        {
          key: "place",
          label: "Location",
          type: "place",
          required: true,
          description: "Latitude and longitude",
        },
      ],
      dynamicFields: [
        { key: "photo", label: "Photo", type: "image", required: false },
        { key: "website", label: "Website", type: "link", required: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("templates").insertOne(template);
    templateId = result.insertedId.toString();
  });

  afterAll(async () => {
    if (templateId) {
      await db
        .collection("templates")
        .deleteOne({ _id: new ObjectId(templateId) });

      await db
        .collection("forms")
        .deleteMany({ templateId: new ObjectId(templateId) });
    }

    await disconnectDB();
  });

  it("should upload a file and return a UUID filename", async () => {
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("status", "created");
    formData.append("place.lat", "10");
    formData.append("place.lng", "10");
    formData.append("website", "https://example.com");

    const content = "Hello World";
    const file = new File([content], "hello.txt", { type: "text/plain" });
    formData.append("photo", file);

    const res = await app.request("/api/form/create", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as CreateFormResponse;

    expect(body.data.photo).toBeDefined();
    expect(body.data.photo!.filename).toMatch(/^[0-9a-f-]{36}\.txt$/);

    const filepath = path.join(
      process.cwd(),
      TEST_STORAGE_DIR,
      body.data.photo!.filename
    );
    const savedContent = await fs.readFile(filepath, "utf-8");
    expect(savedContent).toBe(content);

    await fs.unlink(filepath);
  });

  it("should fail validation with invalid link", async () => {
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("status", "created");
    formData.append("place.lat", "10");
    formData.append("place.lng", "10");
    formData.append("website", "not-a-url");

    const res = await app.request("/api/form/create", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as CreateFormResponse;
    expect(body.error).toBe("ValidationError");
  });

  it("should serve the uploaded file", async () => {
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("status", "created");
    formData.append("place.lat", "10");
    formData.append("place.lng", "10");

    const content = "Serve Me";
    const file = new File([content], "serve.txt", { type: "text/plain" });
    formData.append("photo", file);

    const uploadRes = await app.request("/api/form/create", {
      method: "POST",
      body: formData,
    });

    expect(uploadRes.status).toBe(201);

    const uploadBody = (await uploadRes.json()) as CreateFormResponse;

    expect(uploadBody.data).toBeDefined();
    expect(uploadBody.data.photo).toBeDefined();

    const filename = uploadBody.data.photo!.filename;

    const fileRes = await app.request(`/api/files/${filename}`);
    expect(fileRes.status).toBe(200);

    const text = await fileRes.text();
    expect(text).toBe(content);

    const filepath = path.join(process.cwd(), TEST_STORAGE_DIR, filename);
    await fs.unlink(filepath);
  });
});
