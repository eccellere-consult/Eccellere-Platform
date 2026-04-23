import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

const SYSTEM_PROMPT = `You are an expert at writing marketplace listings for business consulting assets.
Given a specialist's description of their asset, you generate professional marketplace metadata.
Always return ONLY a valid JSON object — no prose, no markdown fences — with these exact keys:
{
  "title": "string (5-10 words, professional)",
  "tagline": "string (max 120 chars, benefit-focused)",
  "category": "one of: ${CATEGORIES.join(", ")}",
  "format": "one of: ${FORMATS.join(", ")}",
  "price": "number in INR (e.g. 4999), choose a reasonable price for Indian B2B consulting assets",
  "aboutResource": "string (2-4 sentences, narrative paragraph about what this resource is and why it matters — India-contextualised)",
  "whatIncluded": ["array of 4-8 strings, each a deliverable item e.g. '100+ categorised business prompts (PDF)'"],
  "contentsPreview": ["array of 4-8 strings, each a section name e.g. 'Section 1: Sales and business development prompts'"],
  "targetAudience": "string (e.g. MSME founders, CFOs, operations managers)",
  "tags": ["array", "of", "3-8", "relevant", "lowercase", "tags"]
}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
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
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate marketplace metadata for this consulting asset:\n\n${description}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
