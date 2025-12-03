import { v4 as uuidv4 } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";

const STORAGE_DIR = "storage";

export const saveFile = async (file: File): Promise<string> => {
  const extension = path.extname(file.name);
  const filename = `${uuidv4()}${extension}`;
  const filepath = path.join(process.cwd(), STORAGE_DIR, filename);

  // Ensure storage directory exists
  await fs.mkdir(path.join(process.cwd(), STORAGE_DIR), { recursive: true });

  const buffer = await file.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));

  return filename;
};

export const getFilePath = (filename: string): string => {
  return path.join(process.cwd(), STORAGE_DIR, filename);
};

export const processFileUploads = async (
  data: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const processedData = await Promise.all(
    Object.entries(data).map(async ([key, value]) => {
      if (value instanceof File) {
        const filename = await saveFile(value);
        return [key, filename];
      }
      return [key, value];
    })
  );
  return Object.fromEntries(processedData);
};
