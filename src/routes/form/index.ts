import { z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createFormRoute, listFormsRoute } from "./form.route.js";
import { createDynamicSchema, FormResponseSchema } from "./form.schema.js";
import { db } from "@/db/mongo.js";

const app = new OpenAPIHono();

app.openapi(createFormRoute, async (c) => {
  // dot notation to parse to object
  const body = await c.req.parseBody({ dot: true });

  const templateId = body.templateId as string;

  let template;
  try {
    const { ObjectId } = await import("mongodb");
    template = await db
      .collection("templates")
      .findOne({ _id: new ObjectId(templateId) });
  } catch (_error) {
    return c.json({ error: "Invalid Template ID" }, 400);
  }

  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  const allFields = [...template.fixedFields, ...template.dynamicFields];
  const dynamicSchema = createDynamicSchema(allFields);

  const { templateId: _, ...rest } = body;
  const formContent = rest;

  const validationResult = dynamicSchema.safeParse(formContent);

  if (!validationResult.success) {
    return c.json(
      {
        error: "ValidationError",
        issues: validationResult.error.issues,
      },
      400,
    );
  }

  const newForm = {
    templateId: templateId,
    data: validationResult.data as z.output<typeof FormResponseSchema>["data"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const result = await db.collection("forms").insertOne(newForm);
    const insertedObj = {
      ...newForm,
      id: result.insertedId.toString(),
    } as z.infer<typeof FormResponseSchema> & { _id?: unknown };
    return c.json((({ _id, ...rest }) => rest)(insertedObj), 201);
  } catch (_error) {
    return c.json({ error: "Failed to create form" }, 500);
  }
});

app.openapi(listFormsRoute, async (c) => {
  try {
    const forms = await db.collection("forms").find().toArray();
    if (forms.length === 0) return c.body(null, 204);
    const result = forms.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id.toString(),
    }));
    return c.json(result, 200);
  } catch (_error) {
    return c.json({ error: "Failed to list forms" }, 500);
  }
});

export default app;
