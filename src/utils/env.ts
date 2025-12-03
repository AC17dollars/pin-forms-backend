import { z } from "@hono/zod-openapi";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.union([
    z.literal("production"),
    z.literal("development"),
    z.literal("test"),
  ]),
  MONGO_URI: z.url(),
  DB_NAME: z.string().min(1),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  JWT_SECRET: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().min(1).max(65535).default(587),
  SMTP_USER: z.email(),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.email(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(z.treeifyError(err), null, 2)
    );
    process.exit(1);
  }
  throw err;
}

export default env;
