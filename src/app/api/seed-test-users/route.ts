import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function seedUsers() {
  try {
    // ── Test Client ──
    const clientUser = await prisma.user.upsert({
      where: { email: "testclient@eccellere.in" },
      update: {},
      create: {
        email: "testclient@eccellere.in",
        phone: "+919876543210",
        name: "Rajesh Kumar",
        role: "CLIENT",
        passwordHash:
          "$2b$12$zR7NZcYmwtsvRC12L419yeKwLlI5Er0eOLfDYTKto7biQB5cHoPa2", // Client1234
        emailVerified: true,
        isActive: true,
        clientProfile: {
          create: {
            companyName: "Kumar Textiles Pvt Ltd",
            businessType: "Private Limited",
            sector: "Manufacturing",
            subSector: "Textiles & Garments",
            revenueRange: "₹1Cr - ₹10Cr",
            employeeRange: "51-200",
            city: "Coimbatore",
            state: "Tamil Nadu",
            yearsInBusiness: 8,
            challenges: JSON.stringify([
              "Scaling operations",
              "Digital transformation",
              "Working capital management",
            ]),
            priorities: JSON.stringify([
              "Revenue growth",
              "Process automation",
              "Market expansion",
            ]),
            consultingExperience: "first_time",
            onboardingComplete: true,
            leadScore: 75,
            referralSource: "google_search",
          },
        },
      },
      include: { clientProfile: true },
    });

    // ── Test Specialist ──
    const specialistUser = await prisma.user.upsert({
      where: { email: "testspecialist@eccellere.in" },
      update: {},
      create: {
        email: "testspecialist@eccellere.in",
        phone: "+919876543211",
        name: "Dr. Priya Sharma",
        role: "SPECIALIST",
        passwordHash:
          "$2b$12$jaCnincRD8F2zywWuQIyBeaXYwDLbm8M1lcL765eJPsElYDB2gLxO", // Specialist1234
        emailVerified: true,
        isActive: true,
        specialistProfile: {
          create: {
            headline: "MSME Growth Strategist & Digital Transformation Expert",
            bio: "15+ years helping Indian MSMEs scale through strategic consulting, digital transformation, and operational excellence. Former McKinsey associate with deep expertise in manufacturing and services sectors.",
            linkedinUrl: "https://linkedin.com/in/priya-sharma-consultant",
            currentRole: "Independent Management Consultant",
            organisation: "Sharma Consulting Partners",
            experienceYears: "15+",
            education: JSON.stringify([
              {
                degree: "PhD in Business Administration",
                institution: "IIM Ahmedabad",
                year: 2012,
              },
              {
                degree: "MBA",
                institution: "IIM Bangalore",
                year: 2008,
              },
              {
                degree: "B.Tech Mechanical Engineering",
                institution: "IIT Madras",
                year: 2006,
              },
            ]),
            certifications: JSON.stringify([
              "PMP - Project Management Professional",
              "Six Sigma Black Belt",
              "Certified Management Consultant (CMC)",
              "Google Analytics Certified",
            ]),
            serviceDomains: JSON.stringify([
              "Strategy & Planning",
              "Digital Transformation",
              "Operations Excellence",
              "Financial Advisory",
            ]),
            sectorExpertise: JSON.stringify([
              "Manufacturing",
              "Textiles",
              "FMCG",
              "IT Services",
              "Healthcare",
            ]),
            challengesAddressed: JSON.stringify([
              "Business scaling",
              "Process optimization",
              "Market entry strategy",
              "Working capital management",
              "Technology adoption",
            ]),
            languages: JSON.stringify(["English", "Hindi", "Tamil"]),
            engagementTypes: JSON.stringify([
              "One-time consultation",
              "Retainer advisory",
              "Project-based",
              "Workshop facilitation",
            ]),
            hourlyRateMin: 3000,
            hourlyRateMax: 8000,
            availability: "part_time",
            monthlyHoursAvail: 40,
            portfolioFiles: JSON.stringify([]),
            status: "ACTIVE",
            approvedAt: new Date(),
            averageRating: 4.8,
            totalAssignments: 23,
            totalEarnings: 450000,
            revenueSharePct: 60,
            panNumber: "ABCPS1234K",
            panVerified: true,
          },
        },
      },
      include: { specialistProfile: true },
    });

    return NextResponse.json({
      status: "ok",
      message: "Test users created successfully",
      users: {
        client: {
          email: clientUser.email,
          name: clientUser.name,
          role: clientUser.role,
          password: "Client1234",
          companyName: clientUser.clientProfile?.companyName,
        },
        specialist: {
          email: specialistUser.email,
          name: specialistUser.name,
          role: specialistUser.role,
          password: "Specialist1234",
          headline: specialistUser.specialistProfile?.headline,
        },
        admin: {
          email: "admin@eccellere.in",
          password: "Admin1234",
          note: "Already exists",
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}

export async function GET() {
  return seedUsers();
}

export async function POST() {
  return seedUsers();
}
