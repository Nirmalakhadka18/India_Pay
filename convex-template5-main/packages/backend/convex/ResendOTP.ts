import { Email } from "@convex-dev/auth/providers/Email";
import { internal } from "./_generated/api";

/**
 * Magic email OTP provider (passwordless).
 * Sends 8-digit OTP verification code via Resend if RESEND_API_KEY is configured,
 * using RESEND_SENDER_EMAIL_AUTH (or falling back to onboarding@resend.dev for test mode).
 * Falls back to internal.email.sendEmail when RESEND_API_KEY is unset (e.g. SMTP/Mailpit/dev).
 */
export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15, // code valid for 15 minutes
  async generateVerificationToken() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => (b % 10).toString()).join("");
  },
  async sendVerificationRequest(
    { identifier: email, token }: { identifier: string; token: string },
    ctx?: { runAction: (ref: unknown, args: unknown) => Promise<unknown> },
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const from =
        process.env.RESEND_SENDER_EMAIL_AUTH || "onboarding@resend.dev";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Your sign-in code",
          text: `Your sign-in code is ${token}`,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Resend API error: ${errorText}`);
      }
    } else {
      await ctx?.runAction(internal.email.sendEmail, {
        to: email,
        subject: "Your sign-in code",
        text: `Your sign-in code is ${token}`,
      });
    }
  },
});
