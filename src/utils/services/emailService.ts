import env from "@/utils/env.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: env.SMTP_SERVICE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export async function sendMagicLinkEmail(email: string, url: string) {
  // If running in development, use the local frontend URL instead of the generated magic link
  const finalUrl = process.env.NODE_ENV === "development" ? "http://localhost:5173" : url;
  // console.log(finalUrl);
  
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Your Magic Link - Sign In",
    html: `
      <h1>Sign In to Your Account</h1>
      <p>Click the link below to sign in:</p>
      <a href="${finalUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Sign In</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}