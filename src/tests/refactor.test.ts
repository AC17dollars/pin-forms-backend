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

interface FormResponse {
  id: string;
  templateId: string;
  data: {
    photo?: {
      type: string;
      url: string;
      filename: string;
    };
    [key: string]: unknown;
  };
}

describe("Refactor and New Features", () => {
  let templateId: string;

  beforeAll(async () => {
    await connectDB();

    const template = {
      name: "Refactor Test Template",
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

  it("should create a form with file and return formatted response", async () => {
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("status", "created");
    formData.append("place.lat", "20");
    formData.append("place.lng", "20");

    const content = "Refactor Test Content";
    const file = new File([content], "refactor.txt", { type: "text/plain" });
    formData.append("photo", file);

    const res = await app.request("/api/form/create", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as FormResponse;

    expect(body.data.photo).toBeDefined();
    expect(body.data.photo!.type).toBe("image");
    expect(body.data.photo!.url).toContain("/api/files/");
    expect(body.data.photo!.filename).toMatch(/^[0-9a-f-]{36}\.txt$/);

    // Clean up file
    const filepath = path.join(
      process.cwd(),
      TEST_STORAGE_DIR,
      body.data.photo!.filename
    );
    await fs.unlink(filepath);
  });

  it("should get forms by template ID with formatted response", async () => {
    const res = await app.request(`/api/form/template/${templateId}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as FormResponse[];
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].templateId).toBe(templateId);

    // Check if response is formatted (even if photo file is deleted, the metadata remains in DB)
    // Note: In real scenario, we might check if file exists, but here we just check structure
    expect(body[0].data.photo).toBeDefined();
    expect(body[0].data.photo!.type).toBe("image");
    expect(body[0].data.photo!.url).toContain("/api/files/");
  });
});
