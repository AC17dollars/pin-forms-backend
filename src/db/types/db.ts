import { ObjectId } from "mongodb";
import { z } from "@hono/zod-openapi";
import {
  TemplateFieldSchema,
  FixedFieldSchema,
} from "@/routes/template/template.schema.js";

export interface Template {
  _id?: ObjectId;
  name: string;
  description?: string;
  markerIcon: string;
  fixedFields: z.infer<typeof FixedFieldSchema>[];
  dynamicFields: z.infer<typeof TemplateFieldSchema>[];
  createdAt: string;
  updatedAt: string;
}

export interface Form {
  _id?: ObjectId;
  templateId: ObjectId;
  data: {
    place: {
      lat: number;
      lng: number;
    };
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}
