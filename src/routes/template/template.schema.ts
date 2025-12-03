import { z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";

export const FieldTypeEnum = z.enum([
  "text",
  "number",
  "date",
  "time",
  "image",
  "document",
  "place",
  "link",
]);

export const TemplateFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: FieldTypeEnum,
    required: z.boolean().default(false),
    description: z.string().optional(),
  })
  .openapi("TemplateFieldSchema");

export const CreateTemplateSchema = z
  .object({
    name: z.string().min(3),
    description: z.string().optional(),

    // user gives slug
    markerIcon: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens allowed")
      .openapi({ example: "event" }),

    fields: z.array(TemplateFieldSchema),
  })
  .openapi("CreateTemplateSchema", {
    example: {
      name: "Event",
      description: "Event description",
      markerIcon: "event",
      fields: [
        {
          key: "name",
          label: "Name",
          type: "text",
          required: true,
        },
        {
          key: "description",
          label: "Description",
          type: "text",
          required: false,
        },
        {
          key: "date",
          label: "Date",
          type: "date",
          required: true,
        },
      ],
    },
  });

export const FixedFieldSchema = z.object({
  key: z.literal("place"),
  label: z.literal("Location"),
  type: z.literal("place"),
  required: z.literal(true),
  description: z.string().default("Latitude and longitude"),
});

export const TemplateResponseSchema = z
  .object({
    id: z.string().refine((val) => ObjectId.isValid(val), "Invalid ObjectId"),
    name: z.string(),
    description: z.string().optional(),
    markerIcon: z.string(),

    fixedFields: z.array(FixedFieldSchema),

    dynamicFields: z.array(TemplateFieldSchema),

    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("TemplateResponseSchema");

export const TemplateListSchema = z.array(TemplateResponseSchema);

export const DeleteTemplateParamSchema = z.object({
  id: z.string().openapi({ param: { name: "id", in: "path" } }),
});
