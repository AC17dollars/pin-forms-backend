import { z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createFormRoute,
  listFormsRoute,
  updateFormRoute,
  deleteFormRoute,
} from "./form.route.js";

import { createDynamicSchema, FormResponseSchema } from "./form.schema.js";
import { db } from "@/db/mongo.js";
import { cLogger } from "@/utils/logger.js";

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
      400
    );
  }

  // if validation has file put string for now
  validationResult.data = Object.fromEntries(
    Object.entries(validationResult.data).map(([key, value]) => {
      if (value instanceof File) {
        return [key, value.toString()];
      }
      return [key, value];
    })
  );

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

app.openapi(updateFormRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = await c.req.parseBody({ dot: true });

  try {
    const { ObjectId } = await import("mongodb");

    // Get existing form to validate against template
    const existingForm = (await db
      .collection("forms")
      .findOne({ _id: new ObjectId(id) })) as z.infer<
      typeof FormResponseSchema
    > & { _id?: unknown };

    if (!existingForm) {
      return c.json({ error: "Form not found" }, 404);
    }

    cLogger.info("Existing form: ", existingForm.templateId);

    // Get template for validation
    const template = await db
      .collection("templates")
      .findOne({ _id: new ObjectId(existingForm.templateId) });

    cLogger.info("Template: ", template);

    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }

    const allFields = [...template.fixedFields, ...template.dynamicFields];
    const dynamicSchema = createDynamicSchema(allFields);

    const validationResult = dynamicSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        {
          error: "ValidationError" as const,
          issues: validationResult.error.issues.map((issue) => ({
            code: String(issue.code),
            path: issue.path.filter((p): p is string | number => p !== null),
            message: issue.message,
          })),
        },
        400
      );
    }

    const updateData = {
      data: validationResult.data as z.output<
        typeof FormResponseSchema
      >["data"],
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .collection("forms")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!result) {
      return c.json({ error: "Form not found" }, 404);
    }

    const updatedForm = {
      ...result,
      id: result._id.toString(),
    } as z.infer<typeof FormResponseSchema> & { _id?: unknown };
    return c.json((({ _id, ...rest }) => rest)(updatedForm), 200);
  } catch (_error) {
    return c.json({ error: "Failed to update form" }, 500);
  }
});

app.openapi(deleteFormRoute, async (c) => {
  const { id } = c.req.valid("param");
  cLogger.info("Got ID: ", id);

  try {
    const { ObjectId } = await import("mongodb");
    const result = await db
      .collection("forms")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return c.json({ error: "Form not found" }, 404);
    }

    return c.body(null, 204);
  } catch (_error) {
    return c.json({ error: "Failed to delete form" + _error }, 500);
  }
});

export default app;
