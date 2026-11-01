/**
 * Configure-Your-Own-Toolkit engine (pure logic, no I/O).
 *
 * Source of truth: Eccellere Problem-to-Value Delivery System skill v1.0.
 *  - Section 2/19: Problem x Solution 2x2 routing
 *  - Sections 7-11: exact canonical report contents per deliverable type
 *  - Section 6.1: evidence / provenance labels
 *
 * Kept free of imports so it can be unit-tested with plain `node --test`.
 */

export type KitType =
  | "DIAGNOSTIC"
  | "PROBLEM_SOLVING"
  | "PLAYBOOK"
  | "GUIDE"
  | "LEARNING";

export type Clarity = "clear" | "unclear" | "unsure";
export type Intent = "discover" | "solve" | "implement" | "learn" | "reference" | "grow";

export const PROVENANCE = [
  "Client-entered",
  "AI-suggested",
  "Source-extracted",
  "Calculated",
  "Consultant-entered",
  "Client-confirmed",
  "Not-known",
  "Not-applicable",
] as const;
export type Provenance = (typeof PROVENANCE)[number];

export type FieldType = "text" | "longtext" | "select" | "number" | "scale4" | "yesno";

export interface KitField {
  id: string;
  label: string;
  type: FieldType;
  guidance: string;
  required: boolean;
  options?: string[];
  /** true when AI may draft this field */
  aiDraftable: boolean;
  /** module/dimension id for diagnostic questions */
  module?: string;
}

export type SectionKind = "auto" | "input" | "analysis";

export interface KitSection {
  /** stable id, e.g. DIAGNOSTIC-03 */
  id: string;
  /** 1-based position in the canonical contents */
  seq: number;
  title: string;
  kind: SectionKind;
  stage: string;
  purpose: string;
  fields: KitField[];
}

export interface KitModule {
  id: string;
  name: string;
  purpose: string;
  weight: number;
}

export interface Blueprint {
  schemaVersion: 1;
  type: KitType;
  title: string;
  industry: string;
  topic: string;
  modules: KitModule[];
  sections: KitSection[];
}

export interface RouteInput {
  problemClarity: Clarity;
  solutionClarity: Clarity;
  intent?: Intent;
  /** future growth / strategy overlay */
  growth?: boolean;
}

export interface RouteResult {
  type: KitType | null;
  quadrant: "Q1" | "Q2" | "Q3" | "Q4" | null;
  label: string;
  rationale: string;
  growthPath: boolean;
  /** set when we cannot decide without one more answer */
  clarifyingQuestion?: string;
}

export const KIT_LABEL: Record<KitType, string> = {
  DIAGNOSTIC: "Diagnostic Kit",
  PROBLEM_SOLVING: "Problem-Solving Kit",
  PLAYBOOK: "Playbook",
  GUIDE: "Guide",
  LEARNING: "Learning Kit",
};

export const KIT_PURPOSE: Record<KitType, string> = {
  DIAGNOSTIC: "Discover and explain: what is happening, where the gaps are, why, and what to prioritise.",
  PROBLEM_SOLVING: "Analyse and select: test causes, generate options, and choose a solution.",
  PLAYBOOK: "Implement and sustain: who does what, when, with which controls and measures.",
  GUIDE: "Explain and reference: a dependable reference without needing a facilitator.",
  LEARNING: "Teach and build capability: learn, practise, explain and demonstrate the skill.",
};

// ─── Routing (skill s2.4 and s19) ───────────────────────────────────────────

export function routeKit(input: RouteInput): RouteResult {
  const { problemClarity: p, solutionClarity: s, intent, growth } = input;
  const growthPath = Boolean(growth || intent === "grow");

  if (intent === "learn") {
    return {
      type: "LEARNING", quadrant: null, label: KIT_LABEL.LEARNING, growthPath,
      rationale: "Your primary need is building capability, so a Learning Kit with practice and assessment fits best.",
    };
  }
  if (intent === "reference") {
    return {
      type: "GUIDE", quadrant: null, label: KIT_LABEL.GUIDE, growthPath,
      rationale: "Your primary need is knowledge and reference, so a Guide fits best. A Guide does not assess your company.",
    };
  }
  if (p === "unsure" || s === "unsure") {
    return {
      type: null, quadrant: null, label: "Not yet decided", growthPath,
      rationale: "We need one more answer before recommending a route.",
      clarifyingQuestion:
        p === "unsure"
          ? "Can you state the affected area, the gap versus what you need, and some evidence it is real?"
          : "Has a specific solution been chosen, designed and approved by your sponsor?",
    };
  }
  if (p === "unclear" && s === "unclear") {
    return {
      type: "DIAGNOSTIC", quadrant: "Q1", label: KIT_LABEL.DIAGNOSTIC, growthPath,
      rationale: "Neither the problem nor the solution is clear yet. Start with a Diagnostic to establish the current state, gaps and root causes.",
    };
  }
  if (p === "unclear" && s === "clear") {
    return {
      type: "DIAGNOSTIC", quadrant: "Q2", label: "Diagnostic Kit (premise validation)", growthPath,
      rationale: "A solution has been proposed before the problem is understood. A focused Diagnostic tests need, fit, value, risks and alternatives before you commit.",
    };
  }
  if (p === "clear" && s === "unclear") {
    return {
      type: "PROBLEM_SOLVING", quadrant: "Q3", label: KIT_LABEL.PROBLEM_SOLVING, growthPath,
      rationale: "The problem is clear but the answer is not. A Problem-Solving Kit tests causes, generates options and selects a solution.",
    };
  }
  return {
    type: "PLAYBOOK", quadrant: "Q4", label: KIT_LABEL.PLAYBOOK, growthPath,
    rationale: "Both the problem and the solution are clear and agreed. A Playbook turns the decision into workstreams, owners, controls and benefits tracking.",
  };
}

// ─── Canonical contents (skill s7-s11, exact order) ─────────────────────────

type Spec = { title: string; kind: SectionKind; stage: string; purpose: string };

const S = (title: string, kind: SectionKind, stage: string, purpose: string): Spec => ({
  title, kind, stage, purpose,
});

export const CANONICAL: Record<KitType, Spec[]> = {
  DIAGNOSTIC: [
    S("Cover Page", "auto", "Setup", "Report cover generated from your context."),
    S("Document Control, Version History and Confidentiality", "input", "Setup", "Who owns, reviews and approves this report."),
    S("Executive Diagnostic Brief", "analysis", "Conclusions", "One-page answer: what we found and what to decide."),
    S("How to Use This Diagnostic Kit", "auto", "Setup", "Reading guide."),
    S("Diagnostic Scope, Context, Assumptions and Exclusions", "input", "Context", "What is in and out of scope, and what we assume."),
    S("Industry and Business Context", "input", "Context", "Business model, value chain, scale and operating context."),
    S("Diagnostic Framework and MECE Dimension Map", "auto", "Assessment", "The dimensions assessed, without overlap or gaps."),
    S("Data Request, Evidence Plan and Source Register", "input", "Evidence", "What evidence exists, where it is, and its reliability."),
    S("Current-State Baseline and KPI / Metric Contract", "input", "Evidence", "Baseline numbers with definitions, units and periods."),
    S("Diagnostic Modules and Assessment Forms", "input", "Assessment", "Scored questions per dimension, with evidence and confidence."),
    S("Scoring Methodology, Weights and Maturity Anchors", "auto", "Assessment", "How scores are calculated."),
    S("Consolidated Diagnostic Scorecard and Heatmap", "analysis", "Analysis", "Scores by dimension, calculated from your answers."),
    S("Performance Gap and Benchmark Analysis", "analysis", "Analysis", "Gap to target; benchmarks only if sourced."),
    S("Issue Tree and Root-Cause Analysis", "analysis", "Analysis", "Hypothesised causes and how each will be tested."),
    S("Findings, Evidence and Confidence Register", "analysis", "Analysis", "Each finding with evidence and confidence."),
    S("Opportunity Assessment and Value Quantification", "analysis", "Conclusions", "Size and type of value, with formulas and assumptions."),
    S("Prioritised Improvement Initiatives", "analysis", "Conclusions", "Initiatives ranked by value, feasibility and risk."),
    S("Implementation Roadmap and Governance", "analysis", "Conclusions", "Sequenced actions, owners and governance."),
    S("Executive Recommendations and Decisions Required", "analysis", "Conclusions", "What leadership must decide, and by when."),
    S("Annexures, Templates, Glossary and References", "auto", "Setup", "Supporting material and sources."),
  ],
  PROBLEM_SOLVING: [
    S("Cover Page", "auto", "Setup", "Report cover."),
    S("Document Control and Version History", "input", "Setup", "Ownership, review and approval."),
    S("Executive Problem-Solving Brief", "analysis", "Conclusions", "The problem, the answer and the decision."),
    S("How to Use the Problem-Solving Kit", "auto", "Setup", "Reading guide."),
    S("Problem Context, Owner, Scope and Decision Mandate", "input", "Problem", "Who owns the problem and what they may decide."),
    S("Problem Statement and Success Criteria", "input", "Problem", "A precise problem and how success is measured."),
    S("Baseline, Impact and Problem Quantification", "input", "Problem", "Current performance and cost of the problem."),
    S("Problem Decomposition and MECE Issue Tree", "input", "Analysis", "Break the problem into non-overlapping parts."),
    S("Data Plan, Evidence Register and Analysis Methods", "input", "Analysis", "What data and methods will test the causes."),
    S("Hypothesis Register and Root-Cause Testing", "input", "Analysis", "Hypotheses, evidence for and against, and tests."),
    S("Validated Root Causes and Causal Logic", "analysis", "Analysis", "Causes that survived testing."),
    S("Solution Principles and Design Constraints", "input", "Solutions", "Rules any solution must respect."),
    S("Solution Generation and Option Longlist", "input", "Solutions", "A wide set of options before narrowing."),
    S("Options Evaluation and Trade-off Analysis", "analysis", "Solutions", "Options compared on value, feasibility, cost, time and risk."),
    S("Pilot / Experiment / Proof-of-Concept Design", "input", "Solutions", "How to test the preferred option cheaply."),
    S("Recommended Solution and Decision Record", "analysis", "Conclusions", "The chosen option, rationale and decision owner."),
    S("Implementation Handover and Playbook Brief", "analysis", "Conclusions", "What the Playbook needs to start."),
    S("Risks, Assumptions and Open Questions", "input", "Conclusions", "What could be wrong and what is still unknown."),
    S("Annexures, Worksheets, Methods and References", "auto", "Setup", "Supporting material and sources."),
  ],
  PLAYBOOK: [
    S("Cover Page", "auto", "Setup", "Report cover."),
    S("Document Control, Version History and Approvals", "input", "Setup", "Ownership, review and approvals."),
    S("Executive Implementation Brief", "analysis", "Conclusions", "What will be delivered, by when, with what outcome."),
    S("How to Use This Playbook", "auto", "Setup", "Reading guide."),
    S("Approved Problem / Opportunity and Solution", "input", "Foundation", "The agreed problem and the agreed solution."),
    S("Outcomes, Scope, Exclusions and Design Principles", "input", "Foundation", "What is in, what is out, and the design rules."),
    S("Target Operating State and Success Measures", "input", "Foundation", "How things will work after implementation."),
    S("Readiness, Prerequisites and Mobilisation", "input", "Mobilise", "What must be true before starting."),
    S("Implementation Architecture and Workstreams", "input", "Plan", "Workstreams, phases and dependencies."),
    S("Step-by-Step Implementation Method", "input", "Plan", "Ordered steps with outputs and acceptance criteria."),
    S("Roles, RACI, Decision Rights and Escalation", "input", "Plan", "Who does, approves and escalates."),
    S("Resources, Technology, Data and Budget", "input", "Plan", "What is needed to deliver."),
    S("Change Impact, Communications, Training and Adoption", "input", "Adopt", "How people will adopt the change."),
    S("Risks, Dependencies and Controls", "input", "Adopt", "What could go wrong and how it is controlled."),
    S("KPI, Benefits Realisation and Performance Management", "input", "Track", "Baselines, targets, owners and cadence."),
    S("Implementation Roadmap and Milestones", "analysis", "Track", "30/60/90-day or longer roadmap."),
    S("Governance Calendar and Reporting", "input", "Track", "Meetings, reports and decision forums."),
    S("Completion Gates and Sustainment", "input", "Sustain", "Binary gates that prove completion."),
    S("Post-Implementation Review and Lessons Learned", "input", "Sustain", "How results and lessons will be captured."),
    S("Annexures, Templates, Checklists and References", "auto", "Setup", "Supporting material and sources."),
  ],
  GUIDE: [
    S("Cover Page", "auto", "Setup", "Report cover."),
    S("Document Control and Version History", "input", "Setup", "Ownership and versions."),
    S("About This Guide and Intended Audience", "input", "Setup", "Who the Guide is for and why."),
    S("How to Use the Guide", "auto", "Setup", "Reading guide."),
    S("Contents", "auto", "Setup", "Navigation."),
    S("Executive Overview / Why the Topic Matters", "analysis", "Foundation", "Why this topic matters to your business."),
    S("Definitions, Principles and Conceptual Foundation", "analysis", "Foundation", "Plain-language definitions and principles."),
    S("Industry / Functional Context and Use Cases", "input", "Foundation", "How the topic applies in your context."),
    S("Core Frameworks, Models, Methods or Standards", "analysis", "Content", "The main frameworks, with limitations."),
    S("Step-by-Step Application Guidance", "analysis", "Content", "How to apply the topic, step by step."),
    S("Worked Examples and Case Studies", "analysis", "Content", "Examples labelled as illustrative."),
    S("Decision Criteria, Trade-offs and When to Use / Not Use", "analysis", "Content", "When this approach fits and when it does not."),
    S("Common Mistakes, Risks and Troubleshooting", "analysis", "Content", "Typical errors and fixes."),
    S("Templates, Checklists and Quick References", "analysis", "Content", "Reusable tools."),
    S("Implementation Considerations / Next Steps", "input", "Conclusions", "What to do next."),
    S("Glossary", "auto", "Setup", "Terms used."),
    S("References and Source Notes", "auto", "Setup", "Sources and caveats."),
    S("Annexures and Version History", "auto", "Setup", "Supporting material."),
  ],
  LEARNING: [
    S("Cover Page", "auto", "Setup", "Report cover."),
    S("Document Control and Version History", "input", "Setup", "Ownership and versions."),
    S("About the Learning Kit", "input", "Setup", "What the kit is and who it is for."),
    S("Learner Profile, Prerequisites and Expected Outcomes", "input", "Learners", "Who is learning and what they will be able to do."),
    S("How to Use the Learning Kit", "auto", "Setup", "Reading guide."),
    S("Contents and Learning Journey", "auto", "Setup", "Module sequence."),
    S("Competency / Learning Outcome Map", "input", "Learners", "Competencies and how each is evidenced."),
    S("Module 1...N: Concept, Example, Practice and Assessment", "analysis", "Modules", "Teaching modules, each with practice and assessment."),
    S("Integrated Case / Capstone Challenge", "input", "Practice", "A realistic case that combines the modules."),
    S("Knowledge Checks and Answer Guidance", "analysis", "Practice", "Questions with model answers."),
    S("Practical Assessment Rubric", "input", "Practice", "Observable criteria for the skill."),
    S("Feynman Teach-Back and Reflection", "input", "Practice", "Explain it simply to someone else."),
    S("Transfer-to-Work Action Plan", "input", "Apply", "Actions to use the skill at work."),
    S("Facilitator / Self-Study Notes", "analysis", "Apply", "How to run or study the kit."),
    S("Glossary, References and Annexures", "auto", "Setup", "Terms, sources and extras."),
  ],
};

const PREFIX: Record<KitType, string> = {
  DIAGNOSTIC: "DX", PROBLEM_SOLVING: "PS", PLAYBOOK: "PB", GUIDE: "GD", LEARNING: "LK",
};

// ─── Field sets ─────────────────────────────────────────────────────────────

type F = [label: string, type: FieldType, guidance: string, opts?: { required?: boolean; options?: string[]; ai?: boolean }];

const DOC_CONTROL: F[] = [
  ["Report owner (name, role)", "text", "Person accountable for this report.", { required: true, ai: false }],
  ["Reviewer", "text", "Who will review it before approval.", { ai: false }],
  ["Approver", "text", "Who gives final approval. AI never approves on your behalf.", { required: true, ai: false }],
  ["Confidentiality", "select", "How widely the report may be shared.", { options: ["Internal only", "Board only", "Shareable with advisers", "Public"], required: true, ai: false }],
];

const BRIEF: F[] = [
  ["Brief (answer first)", "longtext", "Lead with the conclusion, then the 3 supporting points and the decision needed. Draft with AI, then edit.", { required: true, ai: true }],
];

const FIELD_SETS: Record<KitType, Record<number, F[]>> = {
  DIAGNOSTIC: {
    2: DOC_CONTROL,
    3: BRIEF,
    5: [
      ["Decision this diagnostic must enable", "longtext", "What will leadership decide after reading it?", { required: true, ai: true }],
      ["In scope", "longtext", "Functions, sites, products, periods covered.", { required: true, ai: true }],
      ["Out of scope", "longtext", "What is deliberately excluded.", { ai: true }],
      ["Key assumptions", "longtext", "Temporary assumptions made because evidence is missing.", { ai: true }],
    ],
    6: [
      ["Business model and value chain", "longtext", "How the business makes money and the main steps.", { required: true, ai: true }],
      ["Company scale", "select", "Approximate size.", { options: ["Micro (<10)", "Small (10-49)", "Medium (50-249)", "Large (250+)"], required: true, ai: false }],
      ["Geography and sites", "text", "Where you operate.", { ai: false }],
      ["Market and competitive context", "longtext", "Customers, competitors and shifts that matter.", { ai: true }],
    ],
    8: [
      ["Evidence available", "longtext", "List documents, systems, reports and people who hold the facts. Upload files in the Evidence panel.", { required: true, ai: true }],
      ["Evidence gaps", "longtext", "What you would need but do not have.", { ai: true }],
    ],
    9: [
      ["Key KPIs: current value, unit, period, source", "longtext", "One KPI per line, e.g. 'OTIF 82% (FY25, ERP report)'. Never leave blanks as zero; write Not known.", { required: true, ai: true }],
      ["Targets and how they were set", "longtext", "Internal target, regulatory requirement or external benchmark (name the source).", { ai: true }],
    ],
    13: [
      ["Benchmark sources (if any)", "longtext", "Source, date, definition and comparability. If none, write 'Benchmark not established'.", { ai: false }],
    ],
    14: [
      ["Root-cause hypotheses and how to test each", "longtext", "These are hypotheses, not facts, until tested.", { ai: true }],
    ],
    15: [
      ["Findings (observation > evidence > implication)", "longtext", "Each finding needs evidence and a confidence level.", { ai: true }],
    ],
    16: [
      ["Value pools and how they are calculated", "longtext", "Show formula, units, period and assumptions. Keep cash, revenue, margin and avoided cost separate.", { ai: true }],
    ],
    17: [
      ["Initiative longlist and ranking rationale", "longtext", "Rank by value, feasibility and risk.", { ai: true }],
    ],
    18: [
      ["Roadmap and governance", "longtext", "Phases, owners and review cadence.", { ai: true }],
    ],
    19: [
      ["Decisions required from leadership", "longtext", "Specific decisions, owners and dates.", { required: true, ai: true }],
    ],
  },
  PROBLEM_SOLVING: {
    2: DOC_CONTROL,
    3: BRIEF,
    5: [
      ["Problem owner", "text", "The person accountable for the outcome.", { required: true, ai: false }],
      ["Scope and boundary", "longtext", "What is and is not part of this problem.", { required: true, ai: true }],
      ["Decision mandate", "longtext", "What the owner is authorised to decide, spend or change.", { ai: true }],
    ],
    6: [
      ["Problem statement", "longtext", "Who or what is affected, the gap between current and required performance, magnitude, and why it matters.", { required: true, ai: true }],
      ["Success criteria", "longtext", "Measurable, with target and date.", { required: true, ai: true }],
    ],
    7: [
      ["Baseline and impact", "longtext", "Current performance, period, cost or revenue impact. Mark unknowns as Not known.", { required: true, ai: true }],
    ],
    8: [["Issue tree (MECE branches)", "longtext", "Branches must not overlap and must cover the whole problem.", { required: true, ai: true }]],
    9: [["Data plan and analysis methods", "longtext", "Data needed, source, method (Pareto, 5 Whys, process map, etc.).", { ai: true }]],
    10: [
      ["Hypotheses", "longtext", "One per line: statement, evidence for, evidence against, test, confidence.", { required: true, ai: true }],
    ],
    11: [
      ["Validation results", "longtext", "One per line: H1 | Validated, Rejected or Inconclusive | the evidence that decided it. Use the hypothesis numbers from section 10 (H1, H2 and so on). A hypothesis with no line stays Untested.", { ai: false }],
      ["Causal logic (5 Whys or fishbone)", "longtext", "Show the chain from symptom to root cause, one 'Why?' per line. Only include causes you have tested.", { ai: true }],
    ],
    12: [["Solution principles and constraints", "longtext", "Budget, time, compliance, capability and other limits.", { ai: true }]],
    13: [["Option longlist", "longtext", "Generate widely first: at least 5 distinct options, one per line.", { required: true, ai: true }]],
    14: [
      ["Appraisal criteria and weights", "longtext", "One per line: criterion | weight %. Leave blank to use the proposed defaults (impact, feasibility, cost, time to value, risk, readiness). Weights should total 100.", { ai: false }],
      ["Option scores (1-5)", "longtext", "One per line: option name or number | one score per criterion in the same order, separated by commas (1 = poor, 5 = excellent). Use ? where you do not know. Example: O1 | 4,3,2,5,3,4", { ai: false }],
    ],
    15: [["Pilot design", "longtext", "Scale, duration, success measure and stop rule.", { ai: true }]],
    16: [
      ["Recommended solution", "longtext", "The option you recommend and why it addresses the validated causes.", { ai: true }],
      ["Decision", "select", "The decision owner's decision. AI never decides for you.", { options: ["Approve", "Reject", "Defer", "No-go (do not proceed)"], ai: false }],
      ["Decision owner", "text", "Name and role of the person who made the decision.", { ai: false }],
      ["Decision rationale", "longtext", "Why this decision was taken, including trade-offs accepted.", { ai: true }],
    ],
    18: [["Risks, assumptions, open questions", "longtext", "Include what would change the recommendation.", { ai: true }]],
  },
  PLAYBOOK: {
    2: DOC_CONTROL,
    3: BRIEF,
    5: [
      ["Approved problem / opportunity", "longtext", "As validated and agreed.", { required: true, ai: true }],
      ["Approved solution", "longtext", "What will be implemented and why it addresses the cause.", { required: true, ai: true }],
      ["Sponsor and decision authority", "text", "Who approved it.", { required: true, ai: false }],
    ],
    6: [
      ["Outcomes", "longtext", "Measurable outcomes.", { required: true, ai: true }],
      ["Scope and exclusions", "longtext", "In and out.", { required: true, ai: true }],
      ["Design principles", "longtext", "Rules the implementation must follow.", { ai: true }],
    ],
    7: [["Target operating state", "longtext", "How work will be done after implementation, and the success measures.", { ai: true }]],
    8: [["Readiness and prerequisites", "longtext", "One per line: prerequisite | Ready or Not ready | owner. Cover people, data, systems and approvals needed before start.", { required: true, ai: true }]],
    9: [["Workstreams and phases", "longtext", "One per line: workstream name | scope | owner | depends on (W1, W2...) | stage gate. Workstreams are numbered W1, W2 in the order you list them.", { required: true, ai: true }]],
    10: [["Implementation steps", "longtext", "One per line: action | method | output | validation | owner | workstream (W1, W2...). Every step needs an action, a method, an output and a way to validate it.", { required: true, ai: true }]],
    11: [["RACI and decision rights", "longtext", "One per line: activity | Responsible | Accountable | Consulted | Informed. Use role names; separate several roles with commas. Exactly one Accountable per activity.", { required: true, ai: true }]],
    12: [["Resources, technology, data, budget", "longtext", "State the budget as approved or Not known; never assume.", { ai: true }]],
    13: [["Change, communications, training, adoption", "longtext", "Who is affected and how they will be supported.", { ai: true }]],
    14: [["Risks, dependencies, controls", "longtext", "One per line: risk | likelihood (High, Medium, Low) | impact | counter-action | owner. At least five risks.", { ai: true }]],
    15: [["KPIs: baseline, target, formula, owner, cadence", "longtext", "One per line: KPI | baseline | target | formula | owner | cadence | benefit status (forecast, approved, validated, realised or sustained). Write Not known for a baseline you cannot state.", { required: true, ai: true }]],
    16: [["Roadmap and milestones", "longtext", "One per line: phase | activity | owner | start | end | milestone | depends on | decision gate. Use dates (2026-02-15) or relative days (Day 30, Week 6).", { required: true, ai: true }]],
    17: [["Governance calendar", "longtext", "One per line: forum | cadence (weekly, monthly or quarterly) | attendees | purpose.", { ai: true }]],
    18: [["Completion gates", "longtext", "One per line: gate | evidence required | owner | Met or Open. Gates must be yes or no, and backed by evidence.", { ai: true }]],
    19: [["Post-implementation review plan", "longtext", "When and how results will be reviewed.", { ai: true }]],
  },
  GUIDE: {
    2: DOC_CONTROL,
    3: [
      ["Intended audience", "longtext", "Roles and their level of prior knowledge.", { required: true, ai: true }],
      ["Purpose and scope", "longtext", "What the Guide covers and does not.", { required: true, ai: true }],
    ],
    8: [["Your context and use cases", "longtext", "Where you will apply this topic.", { required: true, ai: true }]],
    15: [["Next steps", "longtext", "What you will do after reading.", { ai: true }]],
  },
  LEARNING: {
    2: DOC_CONTROL,
    3: [
      ["Purpose of the kit", "longtext", "Why this capability matters in your business.", { required: true, ai: true }],
    ],
    4: [
      ["Learner profile", "longtext", "Roles, experience and numbers of learners.", { required: true, ai: true }],
      ["Prerequisites", "longtext", "What learners must already know.", { ai: true }],
      ["Expected outcomes", "longtext", "What learners will be able to do, observably.", { required: true, ai: true }],
    ],
    7: [["Competency map", "longtext", "Competency, level required, how it will be evidenced.", { required: true, ai: true }]],
    9: [["Capstone case", "longtext", "A realistic situation from your business.", { ai: true }]],
    11: [["Assessment rubric", "longtext", "Criteria and what good looks like.", { ai: true }]],
    12: [["Teach-back task and reflection prompts", "longtext", "Each learner explains the idea simply to someone else.", { ai: true }]],
    13: [["Transfer-to-work actions", "longtext", "5-7 verifiable actions with owner and date.", { required: true, ai: true }]],
  },
};

// ─── Diagnostic dimensions ──────────────────────────────────────────────────

const GENERIC_DIMENSIONS: Array<{ name: string; purpose: string }> = [
  { name: "Strategy and Governance", purpose: "Clarity of goals, ownership and decision rights." },
  { name: "Process and Operations", purpose: "How reliably and efficiently work gets done." },
  { name: "People and Capability", purpose: "Skills, roles, incentives and capacity." },
  { name: "Data and Technology", purpose: "Quality, availability and use of data and systems." },
  { name: "Customer and Market", purpose: "Understanding and serving customers and competition." },
  { name: "Financial Performance", purpose: "Cost, cash, margin and measurement discipline." },
];

const QUESTION_STEMS: string[] = [
  "How clearly is {dim} defined and owned for {topic}?",
  "How consistently is {dim} measured for {topic}, with agreed definitions?",
  "How well does current performance in {dim} meet what {topic} requires?",
  "How reliable is the evidence (documents, data, observation) available for {dim}?",
  "How much does {dim} limit results for {topic} today?",
];

export const SCALE4 = [
  "1 Ad hoc / Aware",
  "2 Developing",
  "3 Established",
  "4 Leading",
];

export function slugId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "x";
}

function buildModules(): KitModule[] {
  const n = GENERIC_DIMENSIONS.length;
  const base = Math.floor(100 / n);
  const rem = 100 - base * n;
  return GENERIC_DIMENSIONS.map((d, i) => ({
    id: `M${i + 1}`,
    name: d.name,
    purpose: d.purpose,
    // proposed weights must total 100% (skill s7); remainder to the first module
    weight: base + (i === 0 ? rem : 0),
  }));
}

function mkField(
  type: KitType, seq: number, idx: number, f: F, module?: string,
): KitField {
  const [label, ftype, guidance, o] = f;
  return {
    id: `${PREFIX[type]}${String(seq).padStart(2, "0")}.${idx + 1}`,
    label,
    type: ftype,
    guidance,
    required: o?.required ?? false,
    options: o?.options,
    aiDraftable: o?.ai ?? false,
    module,
  };
}

export interface BlueprintInput {
  type: KitType;
  industry: string;
  topic: string;
  problemText?: string;
}

/** Deterministic blueprint. Always works, with or without AI. */
export function buildTemplateBlueprint(input: BlueprintInput): Blueprint {
  const { type, industry } = input;
  const topic = (input.topic || input.problemText || "your priority area").trim().slice(0, 160);
  const modules = type === "DIAGNOSTIC" ? buildModules() : [];

  const sections: KitSection[] = CANONICAL[type].map((spec, i) => {
    const seq = i + 1;
    let fields: KitField[] = (FIELD_SETS[type][seq] ?? []).map((f, k) => mkField(type, seq, k, f));

    // Diagnostic modules: scored questions live in section 10
    if (type === "DIAGNOSTIC" && seq === 10) {
      fields = [];
      for (const m of modules) {
        QUESTION_STEMS.forEach((stem, q) => {
          const label = stem.replace("{dim}", m.name.toLowerCase()).replace("{topic}", topic);
          fields.push({
            id: `DX10.${m.id}.${q + 1}`,
            label,
            type: "scale4",
            guidance: `Choose the level that best matches today. Use 'Not known' if you cannot say. Evidence strengthens the score. Anchors: ${SCALE4.join("; ")}.`,
            required: false,
            options: SCALE4,
            aiDraftable: true,
            module: m.id,
          });
        });
      }
    }
    return {
      id: `${type}-${String(seq).padStart(2, "0")}`,
      seq,
      title: spec.title,
      kind: spec.kind,
      stage: spec.stage,
      purpose: spec.purpose,
      fields,
    };
  });

  return {
    schemaVersion: 1,
    type,
    title: `${KIT_LABEL[type]}: ${topic}`,
    industry,
    topic,
    modules,
    sections,
  };
}

// ─── Validation (used on any AI-produced additions) ────────────────────────

export function validateBlueprint(bp: Blueprint): string[] {
  const errs: string[] = [];
  const canon = CANONICAL[bp.type];
  if (!canon) return [`Unknown type ${bp.type}`];
  if (bp.sections.length !== canon.length) errs.push("Section count differs from canonical contents");
  canon.forEach((c, i) => {
    const s = bp.sections[i];
    if (!s || s.title !== c.title) errs.push(`Section ${i + 1} must be "${c.title}"`);
  });
  const seen = new Set<string>();
  for (const s of bp.sections) {
    for (const f of s.fields) {
      if (!f.id || !f.label) errs.push(`Field missing id/label in ${s.id}`);
      if (seen.has(f.id)) errs.push(`Duplicate field id ${f.id}`);
      seen.add(f.id);
    }
  }
  if (bp.modules.length) {
    const total = bp.modules.reduce((a, m) => a + m.weight, 0);
    if (total !== 100) errs.push(`Module weights total ${total}, expected 100`);
  }
  return errs;
}

// ─── Progress + scoring ─────────────────────────────────────────────────────

export interface StoredResponse {
  fieldId: string;
  value: unknown;
  provenance: Provenance | string;
}

const isAnswered = (r?: StoredResponse): boolean => {
  if (!r) return false;
  if (r.provenance === "Not-known" || r.provenance === "Not-applicable") return true;
  const v = r.value;
  return !(v === null || v === undefined || (typeof v === "string" && v.trim() === ""));
};

export function sectionProgress(section: KitSection, responses: Record<string, StoredResponse>) {
  const fields = section.fields;
  const required = fields.filter((f) => f.required);
  const answered = fields.filter((f) => isAnswered(responses[f.id])).length;
  const reqAnswered = required.filter((f) => isAnswered(responses[f.id])).length;
  return {
    total: fields.length,
    answered,
    requiredTotal: required.length,
    requiredAnswered: reqAnswered,
    complete: required.length === reqAnswered,
  };
}

export function overallProgress(bp: Blueprint, responses: Record<string, StoredResponse>) {
  let required = 0, reqDone = 0, total = 0, done = 0;
  const missing: string[] = [];
  for (const s of bp.sections) {
    const p = sectionProgress(s, responses);
    required += p.requiredTotal; reqDone += p.requiredAnswered;
    total += p.total; done += p.answered;
    if (!p.complete) missing.push(s.title);
  }
  return {
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    requiredPercent: required === 0 ? 100 : Math.round((reqDone / required) * 100),
    readyToSubmit: required === reqDone,
    missingSections: missing,
  };
}

/**
 * Diagnostic scoring (skill s7): weighted mean of answered scale4 items per module.
 * 'Not known' and N/A are excluded from the denominator and reported as coverage;
 * they are never silently treated as zero.
 */
export function scoreDiagnostic(bp: Blueprint, responses: Record<string, StoredResponse>) {
  const out = bp.modules.map((m) => {
    const qs = bp.sections.flatMap((s) => s.fields).filter((f) => f.module === m.id);
    let sum = 0, n = 0, unknown = 0;
    for (const q of qs) {
      const r = responses[q.id];
      if (!r) continue;
      if (r.provenance === "Not-known" || r.provenance === "Not-applicable") { unknown++; continue; }
      const num = typeof r.value === "number" ? r.value : parseInt(String(r.value ?? ""), 10);
      if (Number.isFinite(num) && num >= 1 && num <= 4) { sum += num; n++; }
    }
    return {
      moduleId: m.id, name: m.name, weight: m.weight,
      score: n ? Math.round((sum / n) * 100) / 100 : null,
      answered: n, unknown, total: qs.length,
      coverage: qs.length ? Math.round(((n + unknown) / qs.length) * 100) : 0,
    };
  });
  const scored = out.filter((m) => m.score !== null);
  const wsum = scored.reduce((a, m) => a + m.weight, 0);
  const overall = wsum
    ? Math.round((scored.reduce((a, m) => a + (m.score as number) * m.weight, 0) / wsum) * 100) / 100
    : null;
  const rag = (s: number | null) => (s === null ? "Not scored" : s < 2 ? "Red" : s < 3 ? "Amber" : "Green");
  return { modules: out.map((m) => ({ ...m, rag: rag(m.score) })), overall, overallRag: rag(overall) };
}

// ─── Topic-tailored diagnostic modules (AI or consultant supplied) ─────────

export interface ProposedModule {
  name: string;
  purpose?: string;
  questions: string[];
}

const clean = (s: unknown, max: number): string =>
  String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Replace the generic diagnostic dimensions with topic-specific ones.
 * Returns null when the proposal is unusable so callers keep the template.
 * Rules: 4-8 modules, 4-10 questions each, equal proposed weights totalling 100.
 */
export function withDiagnosticModules(bp: Blueprint, proposed: ProposedModule[]): Blueprint | null {
  if (bp.type !== "DIAGNOSTIC" || !Array.isArray(proposed)) return null;
  const mods = proposed
    .map((m) => ({
      name: clean(m?.name, 80),
      purpose: clean(m?.purpose, 200),
      questions: (Array.isArray(m?.questions) ? m.questions : [])
        .map((q) => clean(q, 220)).filter((q) => q.length >= 12).slice(0, 10),
    }))
    .filter((m) => m.name && m.questions.length >= 4)
    .slice(0, 8);
  if (mods.length < 4) return null;
  const names = new Set(mods.map((m) => m.name.toLowerCase()));
  if (names.size !== mods.length) return null;

  const base = Math.floor(100 / mods.length);
  const rem = 100 - base * mods.length;
  const modules: KitModule[] = mods.map((m, i) => ({
    id: `M${i + 1}`,
    name: m.name,
    purpose: m.purpose || "Assessed against the diagnostic question set.",
    weight: base + (i === 0 ? rem : 0),
  }));
  const fields: KitField[] = [];
  mods.forEach((m, i) => {
    m.questions.forEach((q, k) => {
      fields.push({
        id: `DX10.M${i + 1}.${k + 1}`,
        label: q,
        type: "scale4",
        guidance: `Choose the level that best matches today. Use 'Not known' if you cannot say. Anchors: ${SCALE4.join("; ")}.`,
        required: false,
        options: SCALE4,
        aiDraftable: true,
        module: `M${i + 1}`,
      });
    });
  });
  const sections = bp.sections.map((s) => (s.seq === 10 ? { ...s, fields } : s));
  const out: Blueprint = { ...bp, modules, sections };
  return validateBlueprint(out).length === 0 ? out : null;
}
