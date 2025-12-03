import { z } from "@hono/zod-openapi";
import type { FieldTypeEnum } from "../template/template.schema.js";
import { ObjectId } from "mongodb";

const coerceLatitude = z.preprocess(
  (val) => (typeof val === "string" ? Number(val) : val),
  z
    .number()
    .min(-90, { message: "Latitude must be >= -90" })
    .max(90, { message: "Latitude must be <= 90" })
);

const coerceLongitude = z.preprocess(
  (val) => (typeof val === "string" ? Number(val) : val),
  z
    .number()
    .min(-180, { message: "Longitude must be >= -180" })
    .max(180, { message: "Longitude must be <= 180" })
);

const fixedFormFieldsShape = {
  "place.lat": coerceLatitude,
  "place.lng": coerceLongitude,
};

export const CreateFormSchema = z
  .object({
    templateId: z.string(),
    status: z.enum(["created", "ongoing", "completed"]),
    ...fixedFormFieldsShape,
  })
  .loose()
  .openapi("CreateFormSchema", {
    example: {
      templateId: "692311b79482546758159437",
      status: "created",
      "place.lat": 28.37815103522934,
      "place.lng": 85.05658285242515,
    },
  });

export const fixedFields = z.object({
  place: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

// Helper to create dynamic schema based on template fields
export const createDynamicSchema = (
  fields: {
    key: string;
    type: z.infer<typeof FieldTypeEnum>;
    required: boolean;
    description?: string;
  }[]
) => {
  const shape: Record<string, z.ZodType<unknown>> = {};
  for (const field of fields) {
    let validator;
    switch (field.type) {
      case "text":
        validator = z.string();
        break;
      case "image":
      case "document":
        // In Hono/node, uploaded files are often File objects (from web standard)
        validator = z.instanceof(File).or(z.any());
        break;
      case "number":
        validator = z.coerce.number();
        break;
      case "date":
        validator = z.iso.date();
        break;
      case "time":
        validator = z.iso.time();
        break;
      case "place":
        validator = z.object({
          lat: z.coerce.number().min(-90).max(90),
          lng: z.coerce.number().min(-180).max(180),
        });
        break;
      case "link":
        validator = z.string().url();
        break;
      default:
        validator = z.any();
    }
    if (!field.required) {
      validator = validator.optional();
    }
    shape[field.key] = validator;
  }
  return fixedFields.catchall(z.any()).extend(shape);
};

export const FormResponseSchema = z
  .object({
    id: z.string().refine((val) => ObjectId.isValid(val), "Invalid ObjectId"),
    templateId: z
      .string()
      .refine((val) => ObjectId.isValid(val), "Invalid ObjectId"),
    status: z.enum(["created", "ongoing", "completed"]),
    data: fixedFields.catchall(z.any()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("FormResponseSchema");

export const FormListSchema = z.array(FormResponseSchema);

export const DeleteFormParamSchema = z.object({
  id: z.string().openapi({ param: { name: "id", in: "path" } }),
});

export const UpdateFormSchema = z
  .object({
    ...fixedFormFieldsShape,
    status: z.enum(["created", "ongoing", "completed"]),
  })
  .loose()
  .openapi("UpdateFormSchema", {
    example: {
      "place.lat": 51.5074,
      "place.lng": -0.1278,
    },
  });
