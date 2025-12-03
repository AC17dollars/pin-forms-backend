import type { Template } from "@/types/db.js";

export const formatFormResponse = (
  form: { data: Record<string, unknown> } & Record<string, unknown>,
  template: Template
): Record<string, unknown> => {
  const formattedData: Record<string, unknown> = { ...form.data };

  // Combine fixed and dynamic fields to check types
  const allFields = [...template.fixedFields, ...template.dynamicFields];

  for (const field of allFields) {
    const value = formattedData[field.key];
    if (value && (field.type === "image" || field.type === "document")) {
      // If value is a string, assume it's the filename
      if (typeof value === "string") {
        formattedData[field.key] = {
          type: field.type,
          url: `/api/files/${value}`,
          filename: value,
        };
      }
    }
  }

  return {
    ...form,
    data: formattedData,
  };
};
