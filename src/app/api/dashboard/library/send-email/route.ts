import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signAssetToken } from "@/lib/asset-token";
import { createRequire } from "module";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/library/send-email
 * Body: { assetId: string }
 *
 * Sends an email to the registered user with a signed, time-limited
 * download link to the purchased asset. Uses tokenised links (7-day TTL)
 * rather than attachments to avoid SES size limits and inconsistent
 * client-side decryption of password-protected Office files.
 */
const LINK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { assetId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { assetId } = body;
  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      orders: {
        where: { status: "PAID", items: { some: { assetId } } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user || user.orders.length === 0) {
    return NextResponse.json({ error: "You have not purchased this asset" }, { status: 403 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { title: true, fileUrls: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;
  if (!fileUrl?.startsWith("/uploads/")) {
    return NextResponse.json(
      { error: "No file is attached to this asset yet. Please contact support." },
      { status: 404 }
    );
  }

  // Signed 7-day download link
  const token = signAssetToken(assetId, user.id, LINK_TTL_SECONDS);
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://eccellere.co.in";
  const downloadUrl = `${baseUrl.replace(/\/$/, "")}/api/files/asset/${token}`;

  const recipientEmail = session.user.email;
  const recipientName = user.name ?? "Client";
  const assetTitle = asset.title;

  // Pick email backend by env: SMTP > SES > none.
  // SMTP is detected by SMTP_HOST being set; SES by EMAIL_PROVIDER=ses.
  const provider = process.env.SMTP_HOST
    ? "smtp"
    : process.env.EMAIL_PROVIDER === "ses"
    ? "ses"
    : "none";

  if (provider === "none" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Email service is not configured. Please contact support@eccellere.in to receive your asset link.",
      },
      { status: 503 }
    );
  }

  const subject = `Your Eccellere Asset: ${assetTitle}`;
  const html = buildEmailHtml(recipientName, assetTitle, downloadUrl, baseUrl);
  const from = process.env.EMAIL_FROM || "noreply@eccellere.in";

  if (provider === "smtp") {
    try {
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodemailer = require("nodemailer") as any;
      const port = parseInt(process.env.SMTP_PORT || "465", 10);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        // 465 → implicit TLS; 587/25 → STARTTLS
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({ from, to: recipientEmail, subject, html });
    } catch (err) {
      console.error("[send-email] SMTP error:", err);
      const message = err instanceof Error ? err.message : "Email delivery failed";
      return NextResponse.json(
        { error: `Could not send email: ${message}` },
        { status: 502 }
      );
    }
  } else if (provider === "ses") {
    try {
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodemailer = require("nodemailer") as any;
      const { SESClient, SendRawEmailCommand } = await import("@aws-sdk/client-ses");

      const streamTransport = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
      });
      const mail = await streamTransport.sendMail({
        from,
        to: recipientEmail,
        subject,
        html,
      });

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = (mail as any).message;
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve());
        stream.on("error", reject);
      });
      const rawMessage = Buffer.concat(chunks);

      const sesClient = new SESClient({
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1",
      });
      await sesClient.send(new SendRawEmailCommand({ RawMessage: { Data: rawMessage } }));
    } catch (err) {
      console.error("[send-email] SES error:", err);
      const message = err instanceof Error ? err.message : "Email delivery failed";
      return NextResponse.json(
        { error: `Could not send email: ${message}` },
        { status: 502 }
      );
    }
  } else {
    console.log(
      `\n[send-email] DEV MODE — would email link to ${recipientEmail}\n  ${downloadUrl}\n`
    );
  }

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}

function buildEmailHtml(
  name: string,
  assetTitle: string,
  downloadUrl: string,
  baseUrl: string
): string {
  const site = baseUrl.replace(/\/$/, "");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Georgia,serif;color:#1B2A4A;max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:16px;margin-bottom:24px;">
    <span style="font-family:Cambria,serif;font-size:20px;font-weight:bold;color:#1B2A4A;">ECCELLERE<span style="color:#B8913A;">+</span></span>
  </div>
  <p style="margin:0 0 12px;">Dear ${escapeHtml(name)},</p>
  <p style="margin:0 0 16px;">
    Your purchased asset <strong>${escapeHtml(assetTitle)}</strong> is ready to download.
  </p>
  <p style="margin:24px 0;text-align:center;">
    <a href="${downloadUrl}"
       style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">
      Download Asset
    </a>
  </p>
  <p style="margin:8px 0;font-size:13px;color:#666;">
    This download link is valid for 7 days and is unique to you. Please do not share it.
  </p>
  <p style="margin:24px 0 8px;font-size:13px;color:#666;">
    You can also download this asset any time from your
    <a href="${site}/dashboard/library" style="color:#c9a84c;">Library</a>.
  </p>
  <p style="margin:8px 0;font-size:13px;color:#666;">
    Questions? Reply to this email or contact
    <a href="mailto:support@eccellere.in" style="color:#c9a84c;">support@eccellere.in</a>.
  </p>
  <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:16px;font-size:12px;color:#999;">
    © 2026 Eccellere Management Consulting · Bengaluru · www.eccellere.in
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
