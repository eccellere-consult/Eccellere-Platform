// Eccellere Email Sending Service
// Abstraction layer: Console logger in dev, AWS SES in production

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailProvider {
  send(options: SendEmailOptions): Promise<EmailResult>;
}

// ─── Console Provider (Development) ─────────────────────────────────────────

class ConsoleEmailProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<EmailResult> {
    const messageId = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  📧  EMAIL SENT (dev mode — console only)               ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log(`║  To:      ${options.to}`);
    console.log(`║  From:    ${options.from || "noreply@eccellere.in"}`);
    console.log(`║  Subject: ${options.subject}`);
    console.log(`║  ID:      ${messageId}`);
    console.log("╚══════════════════════════════════════════════════════════╝\n");
    return { success: true, messageId };
  }
}

// ─── AWS SES Provider (Production) ───────────────────────────────────────────

class SESEmailProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

      const client = new SESClient({
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1",
      });

      const command = new SendEmailCommand({
        Source: options.from || process.env.EMAIL_FROM || "noreply@eccellere.in",
        Destination: {
          ToAddresses: [options.to],
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
        Message: {
          Subject: { Data: options.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: options.html, Charset: "UTF-8" },
          },
        },
      });

      const result = await client.send(command);
      return { success: true, messageId: result.MessageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown SES error";
      console.error("[email-service] SES send failed:", message);
      return { success: false, error: message };
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

let provider: EmailProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (!provider) {
    provider =
      process.env.EMAIL_PROVIDER === "ses"
        ? new SESEmailProvider()
        : new ConsoleEmailProvider();
  }
  return provider;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  return getEmailProvider().send(options);
}

// ─── Convenience Methods ────────────────────────────────────────────────────

import {
  renderWelcomeEmail,
  renderOrderConfirmation,
  renderAssessmentResults,
  renderNewsletter,
  type WelcomeEmailProps,
  type OrderConfirmationProps,
  type AssessmentResultsProps,
  type NewsletterProps,
} from "./email-templates";

export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "Welcome to Eccellere — Let's Get Started",
    html: renderWelcomeEmail(props),
  });
}

export async function sendOrderConfirmation(
  to: string,
  props: OrderConfirmationProps
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Order Confirmed — ${props.assetTitle}`,
    html: renderOrderConfirmation(props),
  });
}

export async function sendAssessmentResults(
  to: string,
  props: AssessmentResultsProps
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Your AI Readiness Score: ${props.score}/100`,
    html: renderAssessmentResults(props),
  });
}

export async function sendNewsletter(
  to: string,
  props: NewsletterProps
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "This Week on Eccellere Perspectives",
    html: renderNewsletter(props),
  });
}

export async function sendPasswordReset(
  to: string,
  recipientName: string,
  resetUrl: string
): Promise<EmailResult> {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
<div style="font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#FAF8F4;color:#0E0E0D;">
  <div style="background:#1A1428;padding:32px 40px;text-align:center;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;color:#FFFFFF;font-size:24px;font-weight:600;letter-spacing:0.05em;">ECCELLERĒ</span>
  </div>
  <div style="padding:40px;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#0E0E0D;margin:0 0 16px 0;">Reset Your Password</h1>
    <p style="font-size:15px;line-height:1.6;color:#3A3935;margin:0 0 16px 0;">Hi ${escapeHtml(recipientName)}, we received a request to reset your password. Click the button below to create a new one:</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#B8913A;color:#FFFFFF;padding:14px 32px;font-size:14px;font-weight:500;text-decoration:none;">Reset Password →</a>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#7A7870;margin:0 0 16px 0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #E5E2DB;margin:24px 0;">
    <p style="font-size:12px;color:#7A7870;margin:0;">For security, this request was received from your account. If you didn't make this request, contact us at <a href="mailto:support@eccellere.in" style="color:#B8913A;">support@eccellere.in</a></p>
  </div>
  <div style="background:#0E0E0D;padding:24px 40px;text-align:center;font-size:12px;color:#7A7870;">
    <p style="margin:0;">© 2026 Eccellere Consulting Pvt. Ltd. · Bengaluru, India</p>
  </div>
</div>
</body></html>`;

  return sendEmail({ to, subject: "Reset Your Eccellere Password", html });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
