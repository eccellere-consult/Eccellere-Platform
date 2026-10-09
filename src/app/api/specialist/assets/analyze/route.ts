import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
Given the extracted text content of a consulting asset file, generate a complete marketplace listing.

Return ONLY a valid JSON object — no prose, no markdown fences — with these exact keys:
{
  "title": "string (5-10 words). Specific, outcome-oriented, capitalise key words. e.g. 'Retail Inventory Optimisation Toolkit' not 'Inventory Guide'.",
  "tagline": "string, max 120 characters. Lead with primary outcome/benefit. India-relevant. No jargon.",
  "category": "one of: ${CATEGORIES.join(", ")}",
  "format": "one of: ${FORMATS.join(", ")}",
  "price": "integer INR. Use these bands by depth: <15 pages: 499-999. 20-40 pages focused toolkit: 1499-2499. 40-80 pages comprehensive playbook: 2999-4999. 80+ pages full diagnostic kit: 5999-7999. Learning kit bundle: 7999-9999. Premium bundle: 9999-14999.",
  "aboutResource": "2-4 sentences, 80-160 words. Structure: (1) the pain/problem this solves, (2) what the resource does and how it differs from generic alternatives, (3) the specific outcome or transformation. When describing outcomes or benefits, express value as percentage improvement ranges (e.g. '15–25% reduction in procurement costs', '20–30% improvement in collections efficiency') rather than absolute rupee figures, since actual impact varies by organisation size, industry, and baseline performance. Mention India business context.",
  "whatIncluded": ["4-8 strings. Each a discrete deliverable component. Format: 'Component name — brief descriptor'. e.g. '90-point value scan checklist — rate practices vs best-in-class'. Map to real sections in the document; do not invent."],
  "contentsPreview": ["4-10 strings. Main sections/chapters/modules using actual heading names from the document. Format: 'Section 1: Heading' or just the heading. Word-for-word from document where possible."],
  "targetAudience": "comma-separated specific roles. e.g. 'MSME founders, Operations managers, Supply chain heads, CFOs'. No generic 'anyone'.",
  "tags": ["3-8 lowercase tags from document themes, industry, function and document type. e.g. 'inventory management', 'working capital', 'msme', 'india', 'diagnostic toolkit'. No filler like 'business' or 'tool'."]
}

QUALITY RULES:
1. Tagline must be <= 120 characters — count carefully.
2. About This Resource MUST mention India, Rs. savings/value, or Indian business context.
3. What's Included items must map to real sections visible in the document — do not invent.
4. Contents Preview headings should match document headings closely.
5. Tags must be lowercase and relevant.
6. If the document is a diagnostic/assessment, emphasise self-scoring, benchmarks, action planning.
7. If the document is a playbook/toolkit, emphasise step-by-step implementation and ready-to-use templates.
8. If the document is a learning kit, emphasise skill-building, exercises, and outcomes.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groqApiKey = env.groqApiKey;
  if (!groqApiKey) {
    return NextResponse.json(
      { error: "AI service not configured. Please add GROQ_API_KEY to your environment." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Block ZIP files — officeparser cannot extract text from them
  const fileName = file instanceof File ? file.name : "";
  if (fileName.toLowerCase().endsWith(".zip")) {
    return NextResponse.json(
      {
        error:
          "ZIP files cannot be analyzed automatically. Use the manual description option instead.",
      },
      { status: 422 }
    );
  }

  const maxSize = 20 * 1024 * 1024; // 20 MB limit for analysis
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large for AI analysis (max 20 MB). Please use the manual description." },
      { status: 413 }
    );
  }

  // Extract text from the file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";
  try {
    // Dynamic require to avoid bundling issues — officeparser is in serverExternalPackages
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const officeparser = require("officeparser");
    // v6 API: parseOffice returns a Promise<AST>; call .toText() for plain text
    const ast = await officeparser.parseOffice(buffer);
    extractedText = ast.toText();
  } catch (err: unknown) {
    console.error("[AI analyze] Text extraction failed:", err);
    return NextResponse.json(
      {
        error:
          "Could not extract text from this file. Try a different format or use manual description.",
      },
      { status: 422 }
    );
  }

  const trimmed = extractedText?.trim() ?? "";
  if (trimmed.length < 50) {
    return NextResponse.json(
      {
        error:
          "Not enough text found in this file to generate a description. Please use the manual description option.",
      },
      { status: 422 }
    );
  }

  // Truncate to ~16000 chars to stay within token limits while preserving section structure
  const contentForAI = trimmed.slice(0, 16000);

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
            content: `Analyze the following extracted content from a consulting asset file and generate professional marketplace metadata:\n\n${contentForAI}`,
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
    console.error("[AI analyze] Groq error:", groqResponse.status, errText);
    return NextResponse.json(
      { error: "AI service returned an error. Please try again." },
      { status: 502 }
    );
  }

  const groqData = await groqResponse.json();
  const content: string = groqData.choices?.[0]?.message?.content ?? "";

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
      { error: "Could not parse AI response. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    title: typeof parsed.title === "string" ? parsed.title : "",
    tagline: typeof parsed.tagline === "string" ? parsed.tagline.slice(0, 120) : "",
    category: CATEGORIES.includes(parsed.category as string) ? parsed.category : "",
    format: FORMATS.includes(parsed.format as string) ? parsed.format : "",
    price: String(parsed.price ?? ""),
    aboutResource: typeof parsed.aboutResource === "string" ? parsed.aboutResource : "",
    whatIncluded: Array.isArray(parsed.whatIncluded) ? parsed.whatIncluded.slice(0, 10) : [],
    contentsPreview: Array.isArray(parsed.contentsPreview) ? parsed.contentsPreview.slice(0, 10) : [],
    targetAudience: typeof parsed.targetAudience === "string" ? parsed.targetAudience : "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
    // First ~800 clean chars of extracted document text — stored as the marketplace preview excerpt
    documentExcerpt: trimmed.slice(0, 800).replace(/\s{2,}/g, " ").trim(),
  });
}
