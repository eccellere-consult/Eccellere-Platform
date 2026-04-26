import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";
import { createRequire } from "module";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/library/send-email
 * Body: { assetId: string }
 *
 * Generates a password-protected copy of the purchased asset file and
 * sends it to the user's registered email as an attachment.
 * Password = the user's login email address.
 */
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

  // ── Verify the user has a PAID order for this asset ──────────────────────
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

  // ── Resolve absolute path ─────────────────────────────────────────────────
  let absPath: string;
  try {
    absPath = resolveUploadPath(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  if (!fs.existsSync(absPath)) {
    return NextResponse.json(
      { error: "File not found on server. Please contact support." },
      { status: 404 }
    );
  }

  // ── Password = user's email address ──────────────────────────────────────
  const password = session.user.email;
  const safeTitle = asset.title.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_");
  const ext = path.extname(absPath).toLowerCase();
  const attachmentName = `${safeTitle}${ext}`;

  const require = createRequire(import.meta.url);
  let attachmentBuffer: Buffer;

  if (ext === ".docx" || ext === ".xlsx" || ext === ".pptx" || ext === ".doc" || ext === ".xls" || ext === ".ppt") {
    // ── Office file — encrypt with officecrypto-tool ──────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const officecrypto = require("officecrypto-tool") as any;
    const inputBuffer = fs.readFileSync(absPath);
    attachmentBuffer = await officecrypto.encrypt(inputBuffer, { password });
  } else {
    // ── PDF / ZIP / other — send as-is (pdf-lib does not support encryption) ──
    attachmentBuffer = fs.readFileSync(absPath);
  }

  // ── Send email via nodemailer + SES (or console in dev) ──────────────────
  const recipientEmail = session.user.email;
  const recipientName = user.name ?? "Client";
  const assetTitle = asset.title;

  const isProduction = process.env.EMAIL_PROVIDER === "ses";

  if (isProduction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer = require("nodemailer") as any;
    const { SESClient, SendRawEmailCommand } = await import("@aws-sdk/client-ses");

    // Build MIME message via nodemailer (stream transport), then send raw via SES
    const streamTransport = nodemailer.createTransport({ streamTransport: true, newline: "unix" });
    const mail = await streamTransport.sendMail({
      from: process.env.EMAIL_FROM || "noreply@eccellere.in",
      to: recipientEmail,
      subject: `Your Eccellere Asset: ${assetTitle}`,
      html: buildEmailHtml(recipientName, assetTitle, recipientEmail, ext),
      attachments: [{ filename: attachmentName, content: attachmentBuffer }],
    });

    // Collect the MIME stream into a buffer
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
  } else {
    // Dev: log and skip actual send
    console.log(
      `\n[send-email] DEV MODE — would send "${attachmentName}" (${attachmentBuffer.length} bytes)`,
      `to ${recipientEmail} with password "${password}"\n`
    );
  }

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}

function buildEmailHtml(name: string, assetTitle: string, email: string, ext: string): string {
  const isPasswordProtected = [".docx", ".xlsx", ".pptx", ".doc", ".xls", ".ppt"].includes(ext);
  const passwordNote = isPasswordProtected
    ? `<p style="margin:16px 0;padding:16px;background:#fdf8ec;border-left:4px solid #c9a84c;font-family:monospace;">
         <strong>Document password:</strong> ${email}
       </p>
       <p style="margin:8px 0;font-size:13px;color:#666;">Use your registered email address as the password to open the document.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Georgia,serif;color:#1B2A4A;max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:16px;margin-bottom:24px;">
    <span style="font-family:Cambria,serif;font-size:20px;font-weight:bold;color:#1B2A4A;">ECCELLERE</span>
  </div>
  <p style="margin:0 0 12px;">Dear ${escapeHtml(name)},</p>
  <p style="margin:0 0 16px;">
    Please find your purchased asset <strong>${escapeHtml(assetTitle)}</strong> attached to this email.
  </p>
  ${passwordNote}
  <p style="margin:24px 0 8px;font-size:13px;color:#666;">
    If you have any questions, reply to this email or contact us at
    <a href="mailto:support@eccellere.in" style="color:#c9a84c;">support@eccellere.in</a>.
  </p>
  <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:16px;font-size:12px;color:#999;">
    © 2025 Eccellere Management Consulting · Bengaluru · www.eccellere.in
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
