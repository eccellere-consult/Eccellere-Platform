import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const CATEGORIES = [
  "Strategy & Planning",
  "Process Transformation",
  "Financial Management",
  "Digital & Technology",
  "Organisation Design",
  "Agentic AI",
  "Sales & Marketing",
  "Supply Chain",
  "HR & Talent",
  "Other",
];

const FORMATS = ["PDF", "Excel / Spreadsheet", "PowerPoint", "Word Document", "ZIP Bundle"];

const SYSTEM_PROMPT = `You are an expert product marketer for Eccellere, an Indian B2B marketplace that sells
business tools, frameworks, and playbooks to MSME founders, CXOs, and functional leaders.
Given a specialist's description of their asset, generate a complete marketplace listing.

Return ONLY a valid JSON object — no prose, no markdown fences — with these exact keys:
{
  "title": "string (5-10 words). Specific, outcome-oriented.",
  "tagline": "string, max 120 characters. Lead with primary outcome. India-relevant.",
  "category": "one of: ${CATEGORIES.join(", ")}",
  "format": "one of: ${FORMATS.join(", ")}",
  "price": "integer INR. Bands: <15pp: 499-999; 20-40pp toolkit: 1499-2499; 40-80pp playbook: 2999-4999; 80+pp diagnostic: 5999-7999; learning-kit bundle: 7999-9999.",
  "aboutResource": "2-4 sentences, 80-160 words. Pain -> Differentiation -> Outcome. When describing outcomes or benefits, express value as percentage improvement ranges (e.g. '15–25% reduction in procurement costs', '20–30% improvement in collections efficiency') rather than absolute rupee figures, since actual impact varies by organisation size, industry, and baseline performance. Mention India business context.",
  "whatIncluded": ["4-8 'Component name — descriptor' lines"],
  "contentsPreview": ["4-10 section/chapter names"],
  "targetAudience": "comma-separated specific roles",
  "tags": ["3-8 lowercase, relevant tags"]
}

QUALITY RULES:
1. Tagline <= 120 characters.
2. About This Resource must reference India, Rs. impact, or Indian business context.
3. Tags must be lowercase, no generic filler.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only APPROVED or ACTIVE specialists (and SPECIALIST_ADMIN) can use the AI generator
  if (session.user.role !== "SPECIALIST_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { specialistProfile: { select: { status: true } } },
    });
    const status = user?.specialistProfile?.status as string | undefined;
    if (!status || !["APPROVED", "ACTIVE"].includes(status)) {
      return NextResponse.json(
        { error: "Your specialist profile must be approved before you can create marketplace assets." },
        { status: 403 }
      );
    }
  }

  const groqApiKey = env.groqApiKey;
  if (!groqApiKey) {
    return NextResponse.json(
      { error: "AI service not configured. Please add GROQ_API_KEY to your environment." },
      { status: 503 }
    );
  }

  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description || description.length < 20) {
    return NextResponse.json(
      { error: "Please provide at least 20 characters describing your asset." },
      { status: 400 }
    );
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description too long (max 2000 chars)." }, { status: 400 });
  }

  let groqResponse: Response;
  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate marketplace metadata for this consulting asset:\n\n${description}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach AI service. Please try again." },
      { status: 502 }
    );
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text().catch(() => "");
    console.error("[AI generate] Groq error:", groqResponse.status, errText);
    return NextResponse.json(
      { error: "AI service returned an error. Please try again." },
      { status: 502 }
    );
  }

  const groqData = await groqResponse.json();
  const content: string = groqData.choices?.[0]?.message?.content ?? "";

  // Extract JSON from the response — strip any accidental markdown fences
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "AI returned an unexpected format. Please try again." },
      { status: 502 }
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid JSON. Please try again." },
      { status: 502 }
    );
  }

  // Sanitise and validate each field before returning to client
  const result = {
    title: typeof parsed.title === "string" ? parsed.title.slice(0, 200) : "",
    tagline: typeof parsed.tagline === "string" ? parsed.tagline.slice(0, 120) : "",
    category: CATEGORIES.includes(parsed.category as string)
      ? (parsed.category as string)
      : "Other",
    format: FORMATS.includes(parsed.format as string)
      ? (parsed.format as string)
      : "PDF",
    price: String(Number(parsed.price) > 0 ? Math.round(Number(parsed.price) / 100) * 100 : 4999),
    aboutResource: typeof parsed.aboutResource === "string" ? parsed.aboutResource.slice(0, 2000) : "",
    whatIncluded: Array.isArray(parsed.whatIncluded)
      ? (parsed.whatIncluded as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10)
      : [],
    contentsPreview: Array.isArray(parsed.contentsPreview)
      ? (parsed.contentsPreview as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10)
      : [],
    targetAudience:
      typeof parsed.targetAudience === "string" ? parsed.targetAudience.slice(0, 200) : "",
    tags: Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.toLowerCase().slice(0, 50))
          .slice(0, 8)
      : [],
  };

  return NextResponse.json(result);
}
