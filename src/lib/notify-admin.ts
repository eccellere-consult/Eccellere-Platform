// Admin notification helper — sends an email alert to ADMIN_NOTIFY_EMAIL
// via Hostinger SMTP when a new contact form or registration is received.
// Designed to fail silently so submission flows are never broken.

import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "contact@eccellere.co.in";
const FROM_EMAIL = process.env.EMAIL_FROM || "contact@eccellere.co.in";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter(): ReturnType<typeof nodemailer.createTransport> | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || pass.startsWith("REPLACE_")) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(fields: Record<string, unknown>): string {
  return Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#F5F2EA;font-weight:600;color:#2E2D26;border-bottom:1px solid #E8E4D8;">${escapeHtml(
          k
        )}</td><td style="padding:6px 12px;color:#2E2D26;border-bottom:1px solid #E8E4D8;">${escapeHtml(
          Array.isArray(v) ? v.join(", ") : v
        )}</td></tr>`
    )
    .join("");
}

async function send(subject: string, intro: string, fields: Record<string, unknown>, replyTo?: string) {
  const t = getTransporter();
  if (!t) {
    console.warn("[notify-admin] SMTP not configured — skipping email alert");
    return;
  }
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#FAF8F2;padding:24px;color:#2E2D26;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E8E4D8;border-radius:6px;overflow:hidden;">
    <div style="background:#1B2A3A;color:#fff;padding:18px 24px;">
      <div style="font-size:11px;letter-spacing:2px;color:#B8913A;text-transform:uppercase;">Eccellere · Website Alert</div>
      <div style="font-size:20px;font-weight:300;margin-top:6px;">${escapeHtml(subject)}</div>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;color:#5A5750;">${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${renderRows(fields)}</table>
      <p style="margin:18px 0 0;font-size:12px;color:#7A7870;">Received: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
    </div>
  </div></body></html>`;

  try {
    await t.sendMail({
      from: `"Eccellere Website" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[Eccellere] ${subject}`,
      html,
      replyTo: replyTo || undefined,
    });
  } catch (err) {
    console.error("[notify-admin] SMTP send failed:", err instanceof Error ? err.message : err);
  }
}

export async function notifyContactSubmission(data: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  sector?: string | null;
  inquiryType: string;
  message: string;
}) {
  await send(
    `New contact form: ${data.inquiryType}`,
    `${data.name} (${data.email}) submitted the Talk to Us form.`,
    {
      Name: data.name,
      Email: data.email,
      Phone: data.phone,
      Company: data.company,
      Sector: data.sector,
      "Inquiry Type": data.inquiryType,
      Message: data.message,
    },
    data.email
  );
}

export async function notifyRegistration(data: {
  name: string;
  email: string;
  phone?: string | null;
  role: "CLIENT" | "SPECIALIST";
  company?: string | null;
  city?: string | null;
  state?: string | null;
  headline?: string | null;
}) {
  const label = data.role === "SPECIALIST" ? "specialist" : "client";
  await send(
    `New ${label} registration: ${data.name}`,
    data.role === "CLIENT"
      ? `${data.name} (${data.email}) just registered as a client. They cannot sign in until you approve them: open Admin, Clients and press Approve.`
      : `${data.name} (${data.email}) just registered as a ${label}.`,
    {
      Name: data.name,
      Email: data.email,
      Phone: data.phone,
      Role: data.role,
      Company: data.company,
      Headline: data.headline,
      Location: [data.city, data.state].filter(Boolean).join(", ") || null,
    },
    data.email
  );
}
