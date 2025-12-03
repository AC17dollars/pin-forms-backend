import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/db/connection.js";
import { magicLink, openAPI } from "better-auth/plugins";
import { sendMagicLinkEmail } from "@/services/email.service.js";
import env from "./env.js";

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  plugins: [
    openAPI({ disableDefaultReference: true }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (env.NODE_ENV === "development")
          console.log(`\n\n✨ Magic Link for ${email}: ${url}\n\n`);
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  database: mongodbAdapter(db),
});
