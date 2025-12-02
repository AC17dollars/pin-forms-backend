import env from "@/utils/env.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: env.SMTP_SERVICE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});
const currentYear = new Date().getFullYear();

export async function sendMagicLinkEmail(email: string, url: string) {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Pins Form Map | Sign in to your account",
    html: emailTemplate
      .replaceAll("{{url}}", url)
      .replaceAll("{{current_year}}", currentYear.toString()),
  });
}

const emailTemplate = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;; line-height: 1.5;">
    <tr>
        <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; border: 1px solid #e5e7eb; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                
                <tr>
                    <td align="center" style="padding: 25px 30px 15px;">
                        <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Pins Form App</h2>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 0 30px 40px;">
                        <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; text-align: center;">Sign In to Your Account</h1>
                        
                        <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; text-align: center;">
                            Click the button below to instantly access your account without a password.
                        </p>

                        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin-bottom: 25px;">
                            <tr>
                                <td align="center">
                                    <a href="{{url}}" target="_blank" 
                                       style="display: inline-block; padding: 12px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 1px solid #059669; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                                        Click to Sign In Securely
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 25px;">
                            This link will expire in 24 hours. For security, do not share this email.
                        </p>

                        <p style="color: #4b5563; font-size: 13px; margin-bottom: 5px;">
                            If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="word-break: break-all; color: #10b981; font-size: 12px; margin: 0;">
                            <a href="{{url}}" style="color: #10b981; text-decoration: underline;">{{url}}</a>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                            © {{current_year}} Pins Form App. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;
