import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, guard } from "@/lib/toolkit/server";
import {
  routeKit,
  buildTemplateBlueprint,
  withDiagnosticModules,
  validateBlueprint,
  type Clarity,
  type Intent,
  type KitType,
} from "@/lib/toolkit/engine";
import { tailorDiagnosticModules } from "@/lib/toolkit/ai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const createLimiter = rateLimit({ limit: 12, windowSeconds: 3600 });
const CLARITY = ["clear", "unclear", "unsure"];
const INTENTS = ["discover", "solve", "implement", "learn", "reference", "grow"];
const TYPES = ["DIAGNOSTIC", "PROBLEM_SOLVING", "PLAYBOOK", "GUIDE", "LEARNING"];
const MODES = ["CLIENT_LED", "AI_FIRST_CUT", "AI_ANALYSIS"];

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** GET /api/toolkits - the signed-in user's kits */
async function GET_() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const kits = await prisma.customKit.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      industry: true,
      topic: true,
      kitType: true,
      status: true,
      version: true,
      updatedAt: true,
      _count: { select: { responses: true, evidence: true } },
    },
  });
  return NextResponse.json({ kits });
}

/** POST /api/toolkits - create a kit: route + generate blueprint */
async function POST_(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  if (!createLimiter.check(userId).success) {
    return NextResponse.json({ error: "You have created several kits recently. Please try again later." }, { status: 429 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const industry = str(b.industry, 100);
  const topic = str(b.topic, 160);
  const problemText = str(b.problemText, 4000);
  const contextText = str(b.contextText, 8000);
  if (!industry) return NextResponse.json({ error: "Please choose an industry." }, { status: 422 });
  if (!topic && problemText.length < 10) {
    return NextResponse.json({ error: "Choose a topic or describe the problems you want to address." }, { status: 422 });
  }

  const problemClarity = (CLARITY.includes(String(b.problemClarity)) ? b.problemClarity : "unsure") as Clarity;
  const solutionClarity = (CLARITY.includes(String(b.solutionClarity)) ? b.solutionClarity : "unsure") as Clarity;
  const intent = (INTENTS.includes(String(b.intent)) ? b.intent : undefined) as Intent | undefined;
  const mode = MODES.includes(String(b.mode)) ? String(b.mode) : "CLIENT_LED";

  const route = routeKit({ problemClarity, solutionClarity, intent, growth: Boolean(b.growth) });
  const override = TYPES.includes(String(b.kitType)) ? (b.kitType as KitType) : null;
  const kitType = override ?? route.type;
  if (!kitType) {
    return NextResponse.json(
      { error: route.clarifyingQuestion ?? "We need one more answer to recommend a route.", route },
      { status: 422 },
    );
  }

  const topicLabel = topic || problemText.split(/[.\n]/)[0].slice(0, 120);
  let bp = buildTemplateBlueprint({ type: kitType, industry, topic: topicLabel, problemText });
  let blueprintSource = "template";

  if (kitType === "DIAGNOSTIC") {
    const proposed = await tailorDiagnosticModules({ industry, topic: topicLabel, problemText, contextText });
    const tailored = proposed ? withDiagnosticModules(bp, proposed) : null;
    if (tailored) {
      bp = tailored;
      blueprintSource = "ai";
    }
  }
  if (validateBlueprint(bp).length) {
    return NextResponse.json({ error: "Could not build the form. Please try again." }, { status: 500 });
  }

  const kit = await prisma.customKit.create({
    data: {
      userId,
      title: bp.title,
      industry,
      topic: topicLabel || null,
      problemText: problemText || null,
      contextText: contextText || null,
      problemClarity,
      solutionClarity,
      recommendedType: route.type ?? kitType,
      kitType,
      mode,
      blueprint: bp as never,
      blueprintSource,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: kit.id, kitType, route, blueprintSource }, { status: 201 });
}

export const GET = guard(GET_);
export const POST = guard(POST_);
