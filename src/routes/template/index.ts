import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createTemplateRoute,
  listTemplatesRoute,
  deleteTemplateRoute,
} from "./template.route.js";

import { TemplateResponseSchema } from "./template.schema.js";

import { db } from "@/db/mongo.js";

const app = new OpenAPIHono();

const fixedPlaceField = {
  key: "place",
  label: "Location",
  type: "place",
  required: true,
  description: "Latitude and longitude",
} as const;

app.openapi(createTemplateRoute, async (c) => {
  const data = c.req.valid("json");

  const newTemplate: Omit<z.infer<typeof TemplateResponseSchema>, "id"> = {
    name: data.name,
    markerIcon: data.markerIcon,
    description: data.description,
    fixedFields: [fixedPlaceField],
    dynamicFields: data.fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const result = await db.collection("templates").insertOne(newTemplate);
    const insertedObj = {
      ...newTemplate,
      id: result.insertedId.toString(),
    } as z.infer<typeof TemplateResponseSchema> & { _id?: unknown };
    return c.json((({ _id, ...rest }) => rest)(insertedObj), 201);
  } catch (_error) {
    return c.json({ error: "Failed to create template" }, 500);
  }
});

app.openapi(listTemplatesRoute, async (c) => {
  try {
    const templates = await db.collection("templates").find().toArray();
    if (templates.length === 0) return c.body(null, 204);
    const result = templates.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id.toString(),
    }));
    return c.json(result, 200);
  } catch (_error) {
    return c.json({ error: "Failed to list templates" }, 500);
  }
});

app.openapi(deleteTemplateRoute, async (c) => {
  const { id } = c.req.valid("param");

  try {
    const { ObjectId } = await import("mongodb");
    const result = await db
      .collection("templates")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return c.json({ error: "Template not found" }, 404);
    }

    return c.body(null, 204);
  } catch (_error) {
    return c.json({ error: "Failed to delete template" }, 500);
  }
});

export default app;
