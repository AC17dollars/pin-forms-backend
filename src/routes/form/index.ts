import { z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createFormRoute,
  listFormsRoute,
  getFormsByTemplateRoute,
  updateFormRoute,
  deleteFormRoute,
} from "./form.route.js";

import {
  createDynamicSchema,
  FormResponseSchema,
  FormListSchema,
} from "./form.schema.js";
import { formatFormResponse } from "@/utils/form.utils.js";
import { db } from "@/db/connection.js";
import { cLogger } from "@/utils/logger.js";
import { ObjectId } from "mongodb";
import type { Form, Template } from "@/types/db.js";

const app = new OpenAPIHono();

app.openapi(createFormRoute, async (c) => {
  // dot notation to parse to object
  const body = await c.req.parseBody({ dot: true });

  const templateId = body.templateId as string;

  let template;
  try {
    const { ObjectId } = await import("mongodb");
    template = await db
      .collection<Template>("templates")
      .findOne({ _id: new ObjectId(templateId) });
  } catch (_error) {
    return c.json({ error: "Invalid Template ID" }, 404);
  }

  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  const allFields = [...template.fixedFields, ...template.dynamicFields];
  const dynamicSchema = createDynamicSchema(allFields);

  const { templateId: _, status, ...rest } = body;
  const formContent = rest;

  const validationResult = dynamicSchema.safeParse(formContent);

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

  // Handle file uploads
  const { processFileUploads } = await import("@/services/file.service.js");
  const processedData = await processFileUploads(validationResult.data);

  validationResult.data = processedData;

  const newForm = {
    templateId: new ObjectId(templateId),
    status: status as z.output<typeof FormResponseSchema>["status"],
    data: validationResult.data as z.output<typeof FormResponseSchema>["data"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const result = await db.collection<Form>("forms").insertOne(newForm);
    const insertedObj = {
      ...newForm,
      templateId: templateId.toString(),
      id: result.insertedId.toString(),
    };
    // Format response
    const formattedResponse = formatFormResponse(
      insertedObj,
      template
    ) as z.output<typeof FormResponseSchema>;
    return c.json(formattedResponse, 201);
  } catch (_error) {
    return c.json({ error: "Failed to create form" }, 500);
  }
});

app.openapi(listFormsRoute, async (c) => {
  try {
    const forms = await db.collection<Form>("forms").find().toArray();
    if (forms.length === 0) return c.body(null, 204);

    // Fetch all templates for these forms
    const templateIds = [...new Set(forms.map((f) => f.templateId))];
    const templates = await db
      .collection<Template>("templates")
      .find({ _id: { $in: templateIds } })
      .toArray();

    const templateMap = new Map(templates.map((t) => [t._id.toString(), t]));

    const result = forms.map((form) => {
      const formObj = {
        ...form,
        id: form._id.toString(),
        templateId: form.templateId.toString(),
      };
      const template = templateMap.get(form.templateId.toString());
      if (!template) return formObj;
      return formatFormResponse(formObj, template);
    });
    return c.json(result as z.output<typeof FormListSchema>, 200);
  } catch (_error) {
    return c.json({ error: "Failed to list forms" }, 500);
  }
});

app.openapi(getFormsByTemplateRoute, async (c) => {
  const { templateId } = c.req.valid("param");
  try {
    const { ObjectId } = await import("mongodb");
    const forms = await db
      .collection<Form>("forms")
      .find({ templateId: new ObjectId(templateId) })
      .toArray();
    if (forms.length === 0) return c.body(null, 204);

    const template = await db
      .collection<Template>("templates")
      .findOne({ _id: new ObjectId(templateId) });

    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }

    const result = forms.map((form) => {
      const formObj = {
        ...form,
        id: form._id.toString(),
        templateId: form.templateId.toString(),
      };
      return formatFormResponse(formObj, template);
    });
    return c.json(result as z.output<typeof FormListSchema>, 200);
  } catch (_error) {
    return c.json({ error: "Failed to list forms by template" }, 500);
  }
});

app.openapi(updateFormRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = await c.req.parseBody({ dot: true });

  try {
    const { ObjectId } = await import("mongodb");

    // Get existing form to validate against template
    const existingForm = await db
      .collection<Form>("forms")
      .findOne({ _id: new ObjectId(id) });

    if (!existingForm) {
      return c.json({ error: "Form not found" }, 404);
    }

    cLogger.info("Existing form: ", existingForm.templateId);

    // Get template for validation
    const template = await db
      .collection<Template>("templates")
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

    // Handle file uploads for update
    const { processFileUploads } = await import("@/services/file.service.js");
    const processedData = await processFileUploads(validationResult.data);

    const updateData = {
      data: processedData as z.output<typeof FormResponseSchema>["data"],
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .collection<Form>("forms")
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
      templateId: result.templateId.toString(),
    };
    const formattedResponse = formatFormResponse(
      updatedForm,
      template
    ) as z.output<typeof FormResponseSchema>;
    return c.json(formattedResponse, 200);
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
      .collection<Form>("forms")
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
