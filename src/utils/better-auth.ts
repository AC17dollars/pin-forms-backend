import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/db/mongo.js";
import { magicLink, openAPI } from "better-auth/plugins";
import { sendMagicLinkEmail } from "@/utils/services/emailService.js";

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  plugins: [
    openAPI({ disableDefaultReference: true }),
    magicLink({
      sendMagicLink: async ({ email, url, token }, ctx) => {
        // console.log(`\n\n✨ Magic Link for ${email}: ${url}\n\n`);
        await sendMagicLinkEmail(email, url);
        ctx?.setCookie("test", token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      },
    }),
  ],
  database: mongodbAdapter(db),
});
