import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, profile } = body;

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

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
