import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

const SYSTEM_PROMPT = `You are an expert MSME content strategist for Eccellere in India.
Create a practical, business-ready article draft for founders and operators.

Return ONLY valid JSON with exact keys:
{
  "title": "string",
  "excerpt": "string (max 220 chars)",
  "category": "string",
  "tags": ["string", "string"],
  "content": "string (plain text with headings and paragraphs)
}

Rules:
- Keep the tone practical and India-contextual.
- Focus on MSME outcomes, execution, and metrics.
- Content length: 700-1400 words.
- Use section headings and clear paragraphs.
- No markdown fences.
- No hallucinated company claims.
`;

function extractJson(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured (missing GROQ_API_KEY)." },
      { status: 503 }
    );
  }

  let body: { prompt?: string; sourceText?: string; categoryHint?: string; imageUrl?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const sourceText = (body.sourceText || "").trim();
  const categoryHint = (body.categoryHint || "").trim();
  const imageUrl = body.imageUrl || null;

  if (!prompt && !sourceText) {
    return NextResponse.json(
      { error: "Provide a topic/prompt or source text." },
      { status: 400 }
    );
  }

  const userPrompt = [
    `Topic/Prompt: ${prompt || "(none)"}`,
    categoryHint ? `Category hint: ${categoryHint}` : "",
    imageUrl ? `Hero image URL (for context only): ${imageUrl}` : "",
    sourceText ? `Source material:\n${sourceText.slice(0, 12000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 2600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach AI service." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    console.error("[admin/content/ai-draft] groq error", response.status, err);
    return NextResponse.json(
      { error: "AI service returned an error." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(content);

  if (!parsed) {
    return NextResponse.json(
      { error: "AI returned invalid format. Please retry." },
      { status: 502 }
    );
  }

  const tags = Array.isArray(parsed.tags)
    ? (parsed.tags as unknown[])
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return NextResponse.json({
    title: typeof parsed.title === "string" ? parsed.title.slice(0, 200) : "",
    excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt.slice(0, 220) : "",
    category: typeof parsed.category === "string" ? parsed.category.slice(0, 80) : "Strategy",
    tags,
    content: typeof parsed.content === "string" ? parsed.content.slice(0, 25000) : "",
  });
}
