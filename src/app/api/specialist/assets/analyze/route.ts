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
Given the extracted text content of a consulting asset file, you generate professional marketplace metadata.
Always return ONLY a valid JSON object — no prose, no markdown fences — with these exact keys:
{
  "title": "string (5-10 words, professional)",
  "tagline": "string (max 120 chars, benefit-focused)",
  "category": "one of: ${CATEGORIES.join(", ")}",
  "format": "one of: ${FORMATS.join(", ")}",
  "price": "number in INR (e.g. 4999), choose a reasonable price for Indian B2B consulting assets",
  "description": "string (150-300 words, covers what it contains, the problem it solves, who benefits)",
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

  // Truncate to ~4000 chars to stay within token limits
  const contentForAI = trimmed.slice(0, 4000);

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
            content: `Analyze the following extracted content from a consulting asset file and generate professional marketplace metadata:\n\n${contentForAI}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
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
    description: typeof parsed.description === "string" ? parsed.description : "",
    targetAudience: typeof parsed.targetAudience === "string" ? parsed.targetAudience : "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
  });
}
