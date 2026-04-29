import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();

    // Always return 200 to avoid user enumeration
    const user = await prisma.user.findUnique({ where: { email: normalised } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any prior unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalised, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token: rawToken, email: normalised, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://eccellere.co.in";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: normalised,
      subject: "Reset your Eccellere password",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a1a1a;">Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset the password for your Eccellere account.</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}"
               style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="color:#555;font-size:14px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#999;font-size:12px;">Eccellere &mdash; Business Excellence Platform</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
