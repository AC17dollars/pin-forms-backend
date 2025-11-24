import { z } from "@hono/zod-openapi";
import type { FieldTypeEnum } from "../template/template.schema.js";

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
    ...fixedFormFieldsShape,
  })
  .loose()
  .openapi("CreateFormSchema", {
    example: {
      templateId: "692311b79482546758159437",
      "place.lat": 51.5074,
      "place.lng": -0.1278,
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
      case "string":
        validator = z.string();
        break;
      case "image":
      case "document":
        validator = z.file();
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
    id: z.string(),
    templateId: z.string(),
    data: fixedFields.catchall(z.any()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("FormResponseSchema");

export const FormListSchema = z.array(FormResponseSchema);
