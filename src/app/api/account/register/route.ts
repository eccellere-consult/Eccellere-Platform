import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notifyRegistration } from "@/lib/notify-admin";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    // WAF-safe envelope: client may send { d: base64(JSON.stringify(payload)) } to
    // bypass Hostinger ModSec rules that flag characters like <, >, --, ##.
    let body: Record<string, unknown> = raw;
    if (raw && typeof raw === "object" && typeof raw.d === "string" && Object.keys(raw).length === 1) {
      try {
        const decoded = Buffer.from(raw.d, "base64").toString("utf8");
        body = JSON.parse(decoded);
      } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
    }
    const { email, password, name, phone, role, profile } = body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      role?: string;
      profile?: Record<string, unknown> & {
        companyName?: string;
        businessType?: string;
        sector?: string;
        revenueRange?: string;
        employeeRange?: string;
        city?: string;
        state?: string;
        challenges?: string[];
        referralSource?: string;
        linkedinUrl?: string;
        currentRole?: string;
        organisation?: string;
        experienceYears?: string;
        bio?: string;
        serviceDomains?: string[];
        sectorExpertise?: string[];
        engagementTypes?: string[];
        availability?: string;
        hourlyRateMin?: number;
        hourlyRateMax?: number;
      };
    };

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isSpecialist = role === "SPECIALIST";

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        phone: phone || undefined,
        role: isSpecialist ? "SPECIALIST" : "CLIENT",
        // A new client login waits for an admin's approval before it can sign in. (Specialists go through their own application review.)
        accountStatus: isSpecialist ? "APPROVED" : "PENDING",
        ...(isSpecialist && profile
          ? {
              specialistProfile: {
                create: {
                  linkedinUrl: profile.linkedinUrl || "",
                  currentRole: profile.currentRole || "",
                  experienceYears: profile.experienceYears || "",
                  organisation: profile.organisation || undefined,
                  bio: profile.bio || undefined,
                  headline: profile.currentRole
                    ? `${profile.currentRole}${profile.organisation ? ` at ${profile.organisation}` : ""}`
                    : undefined,
                  serviceDomains: profile.serviceDomains || [],
                  sectorExpertise: profile.sectorExpertise || [],
                  engagementTypes: profile.engagementTypes || [],
                  challengesAddressed: [],
                  languages: ["English"],
                  education: [],
                  certifications: [],
                  portfolioFiles: [],
                  availability: profile.availability || "part_time",
                  hourlyRateMin: profile.hourlyRateMin || undefined,
                  hourlyRateMax: profile.hourlyRateMax || undefined,
                  status: "APPLIED",
                },
              },
            }
          : {}),
        ...(!isSpecialist && profile
          ? {
              clientProfile: {
                create: {
                  companyName: profile.companyName || "",
                  businessType: profile.businessType || "",
                  sector: profile.sector || "",
                  revenueRange: profile.revenueRange || "",
                  employeeRange: profile.employeeRange || "",
                  city: profile.city || "",
                  state: profile.state || "",
                  challenges: profile.challenges || [],
                  priorities: [],
                  referralSource: profile.referralSource || undefined,
                  onboardingComplete: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Fire-and-forget admin email notification (never blocks the response)
    notifyRegistration({
      name: user.name || name,
      email: user.email,
      phone: phone || null,
      role: user.role === "SPECIALIST" ? "SPECIALIST" : "CLIENT",
      company: profile?.companyName || profile?.organisation || null,
      city: profile?.city || null,
      state: profile?.state || null,
      headline: profile?.currentRole
        ? `${profile.currentRole}${profile.organisation ? ` at ${profile.organisation}` : ""}`
        : null,
    }).catch((err) => console.error("[register] notify failed:", err));

    return NextResponse.json(
      { message: isSpecialist ? "Account created successfully" : "Account created. It will be active once the Eccellere team approves it.", user, pendingApproval: !isSpecialist },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
