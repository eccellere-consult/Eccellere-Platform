// Database Seed Script for Eccellere Platform
// Run with: npx ts-node prisma/seed.ts
// (Requires DATABASE_URL to be set)

import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Eccellere database...\n");

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminPassword = await hash("EccAdmin2026!", 12);
  const userPassword = await hash("Welcome123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@eccellere.in" },
    update: {},
    create: {
      email: "admin@eccellere.in",
      name: "Eccellere Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Super Admin:", superAdmin.email);

  const contentAdmin = await prisma.user.upsert({
    where: { email: "content@eccellere.in" },
    update: {},
    create: {
      email: "content@eccellere.in",
      name: "Aarav Sharma",
      passwordHash: adminPassword,
      role: "CONTENT_ADMIN",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Content Admin:", contentAdmin.email);

  const client1 = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      email: "priya@example.com",
      name: "Priya Nair",
      passwordHash: userPassword,
      role: "CLIENT",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Client:", client1.email);

  const client2 = await prisma.user.upsert({
    where: { email: "vikram@example.com" },
    update: {},
    create: {
      email: "vikram@example.com",
      name: "Vikram Reddy",
      passwordHash: userPassword,
      role: "CLIENT",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Client:", client2.email);

  const specialist1 = await prisma.user.upsert({
    where: { email: "ananya@example.com" },
    update: {},
    create: {
      email: "ananya@example.com",
      name: "Ananya Verma",
      passwordHash: userPassword,
      role: "SPECIALIST",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Specialist:", specialist1.email);

  const specialist2 = await prisma.user.upsert({
    where: { email: "rajesh@example.com" },
    update: {},
    create: {
      email: "rajesh@example.com",
      name: "Rajesh Iyer",
      passwordHash: userPassword,
      role: "SPECIALIST",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log("  ✓ Specialist:", specialist2.email);

  // ─── Client Profiles ────────────────────────────────────────────────────
  const clientProfile1 = await prisma.clientProfile.upsert({
    where: { userId: client1.id },
    update: {},
    create: {
      userId: client1.id,
      companyName: "Nair Textiles Pvt Ltd",
      businessType: "Manufacturing",
      sector: "Textiles",
      revenueRange: "₹5-25 Cr",
      employeeRange: "50-200",
      city: "Coimbatore",
      state: "Tamil Nadu",
      yearsInBusiness: 12,
      challenges: ["Supply chain optimization", "Quality control"],
      priorities: ["AI adoption", "Process automation"],
      onboardingComplete: true,
      leadScore: 78,
    },
  });

  const clientProfile2 = await prisma.clientProfile.upsert({
    where: { userId: client2.id },
    update: {},
    create: {
      userId: client2.id,
      companyName: "Reddy AgriTech Solutions",
      businessType: "Agriculture Technology",
      sector: "Agriculture",
      revenueRange: "₹1-5 Cr",
      employeeRange: "10-50",
      city: "Hyderabad",
      state: "Telangana",
      yearsInBusiness: 4,
      challenges: ["Market expansion", "Technology adoption"],
      priorities: ["Digital transformation", "Customer acquisition"],
      onboardingComplete: true,
      leadScore: 65,
    },
  });

  console.log("  ✓ Client profiles created");

  // ─── Specialist Profiles ────────────────────────────────────────────────
  const specProfile1 = await prisma.specialistProfile.upsert({
    where: { userId: specialist1.id },
    update: {},
    create: {
      userId: specialist1.id,
      headline: "AI Strategy Consultant | Ex-McKinsey",
      bio: "10+ years helping Indian MSMEs adopt AI and automation. Focused on practical, ROI-driven implementations.",
      linkedinUrl: "https://linkedin.com/in/ananya-verma",
      currentRole: "Independent Consultant",
      organisation: "Verma Consulting",
      experienceYears: "10+",
      education: { degree: "MBA", university: "IIM Bangalore", year: 2014 },
      certifications: [
        { name: "AWS ML Specialty", issuer: "Amazon", year: 2023 },
        { name: "Six Sigma Black Belt", issuer: "ASQ", year: 2019 },
      ],
      serviceDomains: ["AI Strategy", "Process Transformation", "Digital"],
      sectorExpertise: ["Manufacturing", "Textiles", "FMCG"],
      challengesAddressed: ["AI adoption", "Process bottlenecks", "Digital transformation"],
      languages: ["English", "Hindi", "Tamil"],
      engagementTypes: ["Advisory", "Implementation", "Training"],
      hourlyRateMin: 3000,
      hourlyRateMax: 8000,
      availability: "Part-time",
      monthlyHoursAvail: 40,
      status: "ACTIVE",
      averageRating: 4.8,
      totalAssignments: 23,
      totalEarnings: 1450000,
      revenueSharePct: 60,
    },
  });

  const specProfile2 = await prisma.specialistProfile.upsert({
    where: { userId: specialist2.id },
    update: {},
    create: {
      userId: specialist2.id,
      headline: "Operations Excellence & Lean Manufacturing Expert",
      bio: "Former Tata Steel head of operations. Specialises in lean manufacturing and supply chain optimisation for SMEs.",
      linkedinUrl: "https://linkedin.com/in/rajesh-iyer",
      currentRole: "Senior Consultant",
      experienceYears: "15+",
      education: { degree: "B.Tech + MBA", university: "IIT Kharagpur / XLRI", year: 2009 },
      certifications: [
        { name: "PMP", issuer: "PMI", year: 2016 },
        { name: "Lean Six Sigma Master Black Belt", issuer: "IASSC", year: 2020 },
      ],
      serviceDomains: ["Operations", "Strategy", "Process Transformation"],
      sectorExpertise: ["Manufacturing", "Agriculture", "Logistics"],
      challengesAddressed: ["Supply chain", "Operational efficiency", "Cost reduction"],
      languages: ["English", "Hindi", "Kannada"],
      engagementTypes: ["Advisory", "Implementation", "Audit"],
      hourlyRateMin: 4000,
      hourlyRateMax: 12000,
      availability: "Full-time",
      monthlyHoursAvail: 120,
      status: "ACTIVE",
      averageRating: 4.9,
      totalAssignments: 41,
      totalEarnings: 3200000,
      revenueSharePct: 60,
    },
  });

  console.log("  ✓ Specialist profiles created");

  // ─── Assets (Marketplace) ────────────────────────────────────────────────
  const assets = await Promise.all([
    prisma.asset.upsert({
      where: { slug: "ai-readiness-blueprint" },
      update: {},
      create: {
        slug: "ai-readiness-blueprint",
        title: "AI Readiness Blueprint for MSMEs",
        description: "A comprehensive 40-page framework to assess, plan, and execute your AI adoption journey. Includes ROI calculator, vendor evaluation matrix, and 90-day implementation roadmap.",
        category: "AI_TOOLKIT",
        serviceDomain: "AI Strategy",
        targetSectors: ["Manufacturing", "Retail", "Services"],
        complexityLevel: "Intermediate",
        tags: ["AI", "readiness", "MSME", "automation", "blueprint"],
        price: 4999,
        memberPrice: 3499,
        components: { pages: 40, templates: 8, calculators: 2 },
        fileUrls: { pdf: "/files/ai-readiness-blueprint.pdf" },
        previewImages: ["/images/assets/ai-blueprint-preview.jpg"],
        status: "PUBLISHED",
        isFeatured: true,
        authorId: specProfile1.id,
        averageRating: 4.7,
        totalPurchases: 187,
        totalViews: 2340,
        totalRevenue: 934813,
        publishedAt: new Date("2025-09-15"),
      },
    }),
    prisma.asset.upsert({
      where: { slug: "lean-operations-toolkit" },
      update: {},
      create: {
        slug: "lean-operations-toolkit",
        title: "Lean Operations Toolkit",
        description: "Complete lean manufacturing implementation kit with value stream mapping templates, 5S checklists, kaizen event planners, and KPI dashboards tailored for Indian SMEs.",
        category: "OPERATIONS_TEMPLATE",
        serviceDomain: "Operations",
        targetSectors: ["Manufacturing", "Logistics"],
        complexityLevel: "Advanced",
        tags: ["lean", "operations", "manufacturing", "5S", "kaizen"],
        price: 7999,
        memberPrice: 5599,
        components: { templates: 15, checklists: 8, dashboards: 3 },
        fileUrls: { zip: "/files/lean-toolkit.zip" },
        previewImages: ["/images/assets/lean-toolkit-preview.jpg"],
        status: "PUBLISHED",
        isFeatured: true,
        authorId: specProfile2.id,
        averageRating: 4.9,
        totalPurchases: 92,
        totalViews: 1560,
        totalRevenue: 735908,
        publishedAt: new Date("2025-08-20"),
      },
    }),
    prisma.asset.upsert({
      where: { slug: "msme-growth-strategy" },
      update: {},
      create: {
        slug: "msme-growth-strategy",
        title: "MSME Growth Strategy Playbook",
        description: "Proven frameworks for scaling from ₹1 Cr to ₹25 Cr revenue. Covers market expansion, team building, funding strategies, and operational scaling for Indian MSMEs.",
        category: "MSME_GROWTH_KIT",
        serviceDomain: "Strategy",
        targetSectors: ["All"],
        complexityLevel: "Intermediate",
        tags: ["growth", "strategy", "MSME", "scaling", "playbook"],
        price: 5999,
        memberPrice: 4199,
        components: { pages: 55, frameworks: 6, case_studies: 4 },
        fileUrls: { pdf: "/files/growth-playbook.pdf" },
        previewImages: ["/images/assets/growth-playbook-preview.jpg"],
        status: "PUBLISHED",
        isFeatured: false,
        authorId: specProfile1.id,
        averageRating: 4.6,
        totalPurchases: 143,
        totalViews: 1890,
        totalRevenue: 857857,
        publishedAt: new Date("2025-10-01"),
      },
    }),
  ]);

  console.log(`  ✓ ${assets.length} marketplace assets created`);

  // ─── Subscription Plans ────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { slug: "starter" },
      update: {},
      create: {
        name: "Starter",
        slug: "starter",
        description: "Perfect for solo entrepreneurs exploring AI",
        priceMonthly: 999,
        priceAnnual: 9990,
        features: { downloads: 3, support: "email", consultation: false, discountPct: 10 },
        sortOrder: 1,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { slug: "growth" },
      update: {},
      create: {
        name: "Growth",
        slug: "growth",
        description: "For scaling MSMEs ready to transform",
        priceMonthly: 2999,
        priceAnnual: 29990,
        features: { downloads: 10, support: "priority", consultation: true, discountPct: 25 },
        sortOrder: 2,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { slug: "enterprise" },
      update: {},
      create: {
        name: "Enterprise",
        slug: "enterprise",
        description: "Unlimited access for large organisations",
        priceMonthly: 9999,
        priceAnnual: 99990,
        features: { downloads: "unlimited", support: "dedicated", consultation: true, discountPct: 40, teamMembers: 10 },
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`  ✓ ${plans.length} subscription plans created`);

  // ─── Orders ────────────────────────────────────────────────────────────
  const order1 = await prisma.order.upsert({
    where: { orderNumber: "ECC-2026-00001" },
    update: {},
    create: {
      orderNumber: "ECC-2026-00001",
      userId: client1.id,
      subtotal: 4999,
      gstAmount: 900,
      totalAmount: 5899,
      currency: "INR",
      status: "PAID",
      paymentGateway: "razorpay",
      paymentMethod: "UPI",
      invoiceNumber: "INV-2026-00001",
      billingName: "Priya Nair",
      items: {
        create: {
          assetId: assets[0].id,
          unitPrice: 4999,
          totalPrice: 4999,
          downloaded: true,
        },
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { orderNumber: "ECC-2026-00002" },
    update: {},
    create: {
      orderNumber: "ECC-2026-00002",
      userId: client2.id,
      subtotal: 7999,
      gstAmount: 1440,
      totalAmount: 9439,
      currency: "INR",
      status: "PAID",
      paymentGateway: "razorpay",
      paymentMethod: "card",
      invoiceNumber: "INV-2026-00002",
      billingName: "Vikram Reddy",
      billingGstin: "36AABCR1234A1Z5",
      items: {
        create: {
          assetId: assets[1].id,
          unitPrice: 7999,
          totalPrice: 7999,
          downloaded: false,
        },
      },
    },
  });

  console.log("  ✓ 2 orders created");

  // ─── Assignments ────────────────────────────────────────────────────────
  const assignment1 = await prisma.assignment.create({
    data: {
      clientProfileId: clientProfile1.id,
      specialistProfileId: specProfile1.id,
      title: "AI Readiness Assessment & Roadmap",
      brief: "Conduct a thorough AI readiness assessment for Nair Textiles and develop a phased implementation roadmap focusing on quality control automation and supply chain optimisation.",
      sector: "Manufacturing",
      serviceDomain: "AI Strategy",
      deliverables: ["Assessment report", "90-day roadmap", "Vendor shortlist", "ROI projection"],
      status: "IN_PROGRESS",
      estimatedHours: 30,
      agreedFee: 150000,
      feeType: "fixed",
      startDate: new Date("2026-01-15"),
      dueDate: new Date("2026-02-28"),
      milestones: {
        create: [
          { title: "Initial Assessment", sortOrder: 1, dueDate: new Date("2026-01-25"), isCompleted: true, completedAt: new Date("2026-01-23") },
          { title: "Strategy Document", sortOrder: 2, dueDate: new Date("2026-02-10"), isCompleted: false },
          { title: "Implementation Roadmap", sortOrder: 3, dueDate: new Date("2026-02-28"), isCompleted: false },
        ],
      },
    },
  });

  console.log("  ✓ 1 assignment with milestones created");

  // ─── Notifications ────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: client1.id, title: "Welcome to Eccellere!", message: "Your account is set up. Start by exploring the Marketplace.", type: "system", actionUrl: "/marketplace" },
      { userId: client1.id, title: "Order Confirmed", message: "Your order ECC-2026-00001 for AI Readiness Blueprint is confirmed.", type: "order", actionUrl: "/dashboard/orders" },
      { userId: specialist1.id, title: "New Assignment", message: "You've been matched with Nair Textiles for an AI Readiness Assessment.", type: "assignment", actionUrl: "/specialist/assignments" },
      { userId: client2.id, title: "Welcome to Eccellere!", message: "Your account is set up. Take the AI Readiness Assessment to get started.", type: "system", actionUrl: "/assessment" },
    ],
  });

  console.log("  ✓ 4 notifications created");

  // ─── Testimonials ────────────────────────────────────────────────────────
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Meera Krishnan",
        title: "CEO",
        company: "Krishnan Exports",
        sector: "Textiles",
        quote: "Eccellere's AI Readiness Blueprint helped us identify ₹45L in annual savings through automation. The framework was practical and immediately actionable.",
        sortOrder: 1,
      },
      {
        name: "Suresh Patel",
        title: "Managing Director",
        company: "Patel Agro Industries",
        sector: "Agriculture",
        quote: "The specialist assigned to us had deep domain expertise. Within 3 months, we implemented a lean supply chain that reduced waste by 32%.",
        sortOrder: 2,
      },
      {
        name: "Deepa Menon",
        title: "Founder",
        company: "TechServe Solutions",
        sector: "IT Services",
        quote: "From the diagnostic to the implementation roadmap, Eccellere understood our challenges as a growing MSME. Their marketplace tools are worth every rupee.",
        sortOrder: 3,
      },
    ],
  });

  console.log("  ✓ 3 testimonials created");

  // ─── Case Studies ────────────────────────────────────────────────────────
  await prisma.caseStudy.create({
    data: {
      slug: "nair-textiles-ai-quality-control",
      title: "How Nair Textiles Reduced Defects by 40% with AI-Powered Quality Control",
      sector: "Manufacturing",
      service: "AI Strategy",
      challenge: "Nair Textiles was experiencing a 12% defect rate in their weaving process, leading to significant waste and customer complaints. Manual quality inspection was inconsistent and couldn't keep pace with production volumes.",
      approach: "Eccellere deployed our AI Readiness Blueprint followed by a specialist-led implementation. We installed computer vision cameras at key points in the weaving process, trained a custom defect detection model, and integrated real-time alerts into the production dashboard.",
      outcomes: "Defect rate dropped from 12% to 7.2% within the first quarter. The system now catches 94% of defects before finishing, saving an estimated ₹18L annually in waste and rework costs.",
      metrics: { defectReduction: "40%", annualSavings: "₹18L", detectionAccuracy: "94%", implementationTime: "8 weeks" },
      clientQuote: "The ROI was visible within the first month. Eccellere's approach was practical, not theoretical.",
      clientName: "Priya Nair",
      clientTitle: "Director, Nair Textiles",
      isPublished: true,
      publishedAt: new Date("2026-01-10"),
    },
  });

  console.log("  ✓ 1 case study created");

  // ─── Coupons ────────────────────────────────────────────────────────────
  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME20",
        description: "20% off first purchase for new users",
        discountType: "percentage",
        discountValue: 20,
        maxUses: 1000,
        usedCount: 247,
        minOrderAmount: 2000,
        applicableCategories: [],
        applicableSectors: [],
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2026-12-31"),
        isActive: true,
      },
      {
        code: "MSME500",
        description: "₹500 off for verified MSMEs",
        discountType: "fixed",
        discountValue: 500,
        maxUses: 500,
        usedCount: 89,
        minOrderAmount: 3000,
        applicableCategories: ["AI_TOOLKIT", "MSME_GROWTH_KIT"],
        applicableSectors: [],
        validFrom: new Date("2025-06-01"),
        validUntil: new Date("2026-06-30"),
        isActive: true,
      },
    ],
  });

  console.log("  ✓ 2 coupons created");

  // ─── Blog Posts ────────────────────────────────────────────────────────
  await prisma.blogPost.createMany({
    data: [
      {
        slug: "ai-adoption-indian-msmes-2026",
        title: "The State of AI Adoption Among Indian MSMEs in 2026",
        excerpt: "Our latest research reveals that 34% of Indian MSMEs have started their AI journey — but most are stuck at the pilot stage.",
        content: "India's MSME sector, contributing 30% of GDP and employing 110 million people, stands at an inflection point in AI adoption...",
        category: "AI & Technology",
        tags: ["AI", "MSME", "India", "research", "adoption"],
        authorName: "Ananya Verma",
        readingTime: 8,
        status: "published",
        publishedAt: new Date("2026-01-20"),
      },
      {
        slug: "lean-manufacturing-smes-guide",
        title: "A Practical Guide to Lean Manufacturing for Indian SMEs",
        excerpt: "Lean isn't just for large factories. Here's how small and medium manufacturers can implement lean principles with limited budgets.",
        content: "The Toyota Production System revolutionised manufacturing globally, but its principles are often seen as out of reach for smaller Indian firms...",
        category: "Operations",
        tags: ["lean", "manufacturing", "SME", "operations", "guide"],
        authorName: "Rajesh Iyer",
        readingTime: 12,
        status: "published",
        publishedAt: new Date("2026-01-05"),
      },
    ],
  });

  console.log("  ✓ 2 blog posts created");

  // ─── Contact Submissions ────────────────────────────────────────────────
  await prisma.contactSubmission.create({
    data: {
      name: "Amit Shah",
      email: "amit@shahpackaging.com",
      company: "Shah Packaging Ltd",
      sector: "Packaging",
      inquiryType: "General",
      message: "We are a mid-size packaging company looking to automate our quality inspection process. Would like to understand how Eccellere can help us get started with AI.",
      status: "new",
    },
  });

  console.log("  ✓ 1 contact submission created");

  // ─── Newsletter Subscribers ────────────────────────────────────────────
  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "priya@example.com" },
      { email: "vikram@example.com" },
      { email: "newsletter-user@example.com" },
    ],
    skipDuplicates: true,
  });

  console.log("  ✓ 3 newsletter subscribers created");

  // ─── Audit Log ────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: superAdmin.id, action: "SEED_DATABASE", entityType: "System", entityId: "seed", details: { version: "1.0", timestamp: new Date().toISOString() } },
      { userId: client1.id, action: "PURCHASE", entityType: "Order", entityId: order1.id, details: { orderNumber: "ECC-2026-00001" } },
      { userId: client2.id, action: "PURCHASE", entityType: "Order", entityId: order2.id, details: { orderNumber: "ECC-2026-00002" } },
    ],
  });

  console.log("  ✓ 3 audit log entries created");

  console.log("\n✅ Database seeding complete!");
  console.log("   Users: 6 (1 super admin, 1 content admin, 2 clients, 2 specialists)");
  console.log("   Assets: 3 | Plans: 3 | Orders: 2 | Assignments: 1");
  console.log("   Testimonials: 3 | Case Studies: 1 | Blog Posts: 2 | Coupons: 2\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
