/**
 * Method cards for the Problem-Solving Kit (skill s8): for each method, when to use it,
 * when not to, guided steps, a worked illustration and a blank worksheet.
 *
 * This is generic reference content. It is not client data and not a benchmark.
 * Illustrations use invented, clearly labelled placeholder situations.
 */
export interface MethodCard {
  id: string;
  name: string;
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  steps: string[];
  commonErrors: string[];
  illustration: string;
  worksheet: { headers: string[]; rows: string[][] };
}

export const METHOD_CARDS: MethodCard[] = [
  {
    id: "M1", name: "Problem statement, 5W2H and Is / Is-Not",
    purpose: "Turn a vague complaint into a specific, bounded, measurable problem.",
    whenToUse: "At the start, when the problem is described in different ways by different people.",
    whenNotToUse: "When the cause is already proven and what is needed is a decision between options.",
    steps: [
      "Write one sentence: what is affected, the gap between current and required performance, the size and period, and why it matters.",
      "Answer the 5W2H: What, Where, When, Who, Why does it matter, How does it show up, How much (size or cost).",
      "Use Is / Is-Not: for what, where, when and how much, describe where the problem is, and where it could be but is not.",
      "List what is different about the Is column compared with the Is-Not column. Those differences point to causes to test.",
      "Agree the owner, the boundary and the success criterion with a number and a date.",
    ],
    commonErrors: ["Stating a solution as the problem (\"we need an ERP\").", "No baseline or period.", "Mixing several problems in one statement."],
    illustration: "Illustration only (not client data): \"Late deliveries\" becomes \"On-time delivery on route A fell from 94% to 81% between March and June, delaying invoices.\" Is-Not shows routes B and C are unaffected, which narrows the search.",
    worksheet: { headers: ["Dimension", "Is (where the problem occurs)", "Is not (where it could but does not)", "What is different?"], rows: [["What", "", "", ""], ["Where", "", "", ""], ["When", "", "", ""], ["How much", "", "", ""]] },
  },
  {
    id: "M2", name: "MECE logic (issue) tree",
    purpose: "Break the problem into branches that do not overlap and together cover it.",
    whenToUse: "When the problem is large and you need to know where to look first.",
    whenNotToUse: "When the problem is already narrow and the data points to one area.",
    steps: [
      "Write the problem at the top as a question you can answer.",
      "Choose one splitting logic (for example by process step, by customer segment, or by driver such as volume x price x cost).",
      "Check each level: no overlaps between branches, and nothing important missing.",
      "Stop splitting when a branch can be tested with data.",
      "Mark the branches with the largest likely impact to test first.",
    ],
    commonErrors: ["Overlapping branches that double count.", "Mixing two splitting logics on one level.", "Branches too vague to test."],
    illustration: "Illustration only: \"Why is margin falling?\" splits into price, volume mix, input cost and wastage. Each can be checked with a number.",
    worksheet: { headers: ["Level 1 branch", "Level 2 branch", "How to test", "Data source"], rows: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""]] },
  },
  {
    id: "M3", name: "Pareto analysis and stratification",
    purpose: "Find the few categories that account for most of the problem.",
    whenToUse: "When you have counts or amounts by category (defect type, customer, SKU, reason code).",
    whenNotToUse: "When data is unreliable or the categories are not mutually exclusive.",
    steps: [
      "Define the measure (count, cost or time) and the period.",
      "Split the data into categories, then sort from largest to smallest.",
      "Compute each category's share and the running total.",
      "Focus on the categories that make up the first 70 to 80 percent of the total.",
      "Stratify the top categories further (by shift, site, supplier) to find patterns.",
    ],
    commonErrors: ["Counting frequency when cost matters.", "Too many \"other\" items.", "Using a period that hides a recent change."],
    illustration: "Illustration only: four of fifteen return reasons account for most returns; stratifying them by supplier shows one supplier drives most of the largest reason.",
    worksheet: { headers: ["Category", "Count or amount", "Share %", "Running total %"], rows: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""]] },
  },
  {
    id: "M4", name: "5 Whys",
    purpose: "Follow one chain of cause and effect from a symptom to a cause that can be fixed.",
    whenToUse: "For a specific, observable event with a fairly direct causal chain.",
    whenNotToUse: "For complex problems with several interacting causes, or where the answers are opinions with no evidence.",
    steps: [
      "State the specific event, not the general topic.",
      "Ask why it happened and answer with something you can verify.",
      "Repeat on each answer until you reach a cause you can act on (often 3 to 6 steps).",
      "Check the chain backwards: if this cause were removed, would the event stop?",
      "Test each link with evidence before calling it a root cause.",
    ],
    commonErrors: ["Stopping at a person (\"operator error\") instead of a process cause.", "Accepting answers without evidence.", "Following only one branch when there are several."],
    illustration: "Illustration only: Late dispatch, why? Picking started late. Why? Orders arrived in a batch. Why? Orders are released twice a day. Why? The release rule was set for an older system. The release rule is the cause to test.",
    worksheet: { headers: ["Step", "Why? (answer)", "Evidence", "Verified (Y/N)"], rows: [["Why 1", "", "", ""], ["Why 2", "", "", ""], ["Why 3", "", "", ""], ["Why 4", "", "", ""], ["Why 5", "", "", ""]] },
  },
  {
    id: "M5", name: "Fishbone (cause and effect) diagram",
    purpose: "Brainstorm causes across categories so none is overlooked.",
    whenToUse: "When a team needs to look at many possible causes together.",
    whenNotToUse: "When there is already clear evidence of the cause.",
    steps: [
      "Write the effect (the problem statement) on the right.",
      "Choose categories that fit the problem (for example people, process, equipment, materials, measurement, environment).",
      "For each category, list possible causes and ask why for the important ones.",
      "Circle the most likely causes and turn them into hypotheses with a test.",
    ],
    commonErrors: ["Treating the brainstorm as the answer.", "Categories that do not fit the problem.", "No follow-up tests."],
    illustration: "Illustration only: for \"high rework\", the team lists causes under people, process, equipment, material and measurement, then selects three to test.",
    worksheet: { headers: ["Category", "Possible cause", "Why it may matter", "Test to run"], rows: [["People", "", "", ""], ["Process", "", "", ""], ["Equipment / systems", "", "", ""], ["Materials / inputs", "", "", ""], ["Measurement / data", "", "", ""]] },
  },
  {
    id: "M6", name: "Process map and SIPOC",
    purpose: "See how the work actually flows, and where delay, rework or handoffs occur.",
    whenToUse: "When the problem sits inside a process or between teams.",
    whenNotToUse: "When the issue is clearly in a single decision or input, not the flow.",
    steps: [
      "List Suppliers, Inputs, Process (4 to 7 high-level steps), Outputs and Customers (SIPOC).",
      "Walk the real process with the people who do it, not the documented one.",
      "Mark waiting time, handoffs, rework loops and decision points.",
      "Measure time and quality at the steps that look worst.",
    ],
    commonErrors: ["Mapping the intended process, not the real one.", "Too much detail too early.", "No measurements."],
    illustration: "Illustration only: a quote-to-order process shows three approval handoffs; measuring each shows most elapsed time is waiting, not work.",
    worksheet: { headers: ["Suppliers", "Inputs", "Process steps", "Outputs", "Customers"], rows: [["", "", "", "", ""], ["", "", "", "", ""]] },
  },
  {
    id: "M7", name: "FMEA (failure modes and effects)",
    purpose: "Rank what could go wrong in a process or solution by severity, likelihood and detectability.",
    whenToUse: "When failure has serious consequences, or before piloting a new design.",
    steps: [
      "List the steps or components.",
      "For each, list how it could fail and the effect of that failure.",
      "Rate Severity, Occurrence and Detection from 1 to 10 using agreed anchors.",
      "Multiply to get a Risk Priority Number and work on the highest, then re-rate.",
    ],
    whenNotToUse: "When there is no agreed rating scale, or ratings would be guesses with no data.",
    commonErrors: ["Using RPN as the only guide when severity is critical.", "Rating without data or anchors.", "Never re-rating after actions."],
    illustration: "Illustration only: a payment step with low detection and high severity ranks first even if failures are rare.",
    worksheet: { headers: ["Step", "Failure mode", "Effect", "Severity", "Occurrence", "Detection", "RPN", "Action"], rows: [["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""]] },
  },
  {
    id: "M8", name: "Weighted decision matrix",
    purpose: "Compare options on agreed criteria and make trade-offs visible.",
    whenToUse: "When several workable options exist and the choice needs to be explained.",
    whenNotToUse: "When one option is clearly required by law or safety, or when scores would be invented.",
    steps: [
      "Agree the criteria and their weights before scoring (weights total 100).",
      "Define what a 1 and a 5 mean for each criterion.",
      "Score each option with evidence. Use ? where the score is not known.",
      "Compute the weighted score, then test sensitivity: does the top option change under equal weights?",
      "Treat the score as input to judgement, not a replacement for it.",
    ],
    commonErrors: ["Choosing weights after seeing the scores.", "Scoring unknowns as zero.", "Ignoring a close call."],
    illustration: "Illustration only: two options within a quarter of a point should be discussed on risks and reversibility, not decided by the decimal.",
    worksheet: { headers: ["Criterion", "Weight %", "Option A", "Option B", "Option C"], rows: [["", "", "", "", ""], ["", "", "", "", ""], ["", "", "", "", ""]] },
  },
  {
    id: "M9", name: "Cost-benefit and payback",
    purpose: "Compare what an option costs with what it is expected to return.",
    whenToUse: "When an option needs investment and the sponsor must approve spend.",
    whenNotToUse: "When benefits cannot yet be estimated honestly; record them as Not known instead.",
    steps: [
      "List one-off and recurring costs, with the period.",
      "List benefits by type (cash release, revenue, margin, cost, risk) and keep types separate.",
      "State each benefit as potential, approved, validated or realised.",
      "Payback (months) = investment divided by net monthly benefit. Show the formula and assumptions.",
      "Test the result with a cautious case.",
    ],
    commonErrors: ["Double counting the same benefit.", "Treating forecast as realised.", "Leaving out running costs."],
    illustration: "Illustration only: an investment of X with net monthly benefit Y pays back in X divided by Y months; the report must show X, Y and the source of each.",
    worksheet: { headers: ["Item", "Type", "Amount", "Period", "Status (potential, approved, validated, realised)", "Source"], rows: [["", "", "", "", "", ""], ["", "", "", "", "", ""]] },
  },
  {
    id: "M10", name: "Pilot / experiment design",
    purpose: "Test a solution on a small scale before committing to roll-out.",
    whenToUse: "When the solution is uncertain, costly to reverse or affects customers.",
    whenNotToUse: "When the change is trivial and reversible, or a pilot would delay a legally required fix.",
    steps: [
      "State the hypothesis the pilot tests.",
      "Choose a scale small enough to be safe and big enough to learn.",
      "Set the duration, the success measure with a target, and the stop rule in advance.",
      "Define a comparison (before and after, or a control group) and who records the data.",
      "Decide beforehand what will happen on success, partial success and failure.",
    ],
    commonErrors: ["No stop rule.", "Changing the measure mid-pilot.", "No comparison, so the result cannot be trusted."],
    illustration: "Illustration only: \"Run the new reorder rule in 2 stores for 6 weeks. Success is stock-outs down 30% with no rise in aged stock. Stop if stock-outs rise for 2 weeks in a row.\"",
    worksheet: { headers: ["Element", "Your pilot"], rows: [["Hypothesis", ""], ["Scale", ""], ["Duration", ""], ["Success measure and target", ""], ["Stop rule", ""], ["Comparison", ""], ["Decision after the pilot", ""]] },
  },
];

/**
 * Blank templates for the Playbook annexure (skill s9, section 20).
 * Generic worksheets: not client data.
 */
export interface PlaybookTemplate {
  id: string;
  name: string;
  use: string;
  headers: string[];
  rows: string[][];
}

const blank = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => ""));

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  { id: "T1", name: "Workstream charter", use: "One per workstream before work starts.", headers: ["Item", "Entry"], rows: [["Workstream and number", ""], ["Objective and scope", ""], ["Owner", ""], ["Depends on", ""], ["Stage gate and evidence", ""], ["Key risks", ""]] },
  { id: "T2", name: "Step detail sheet", use: "For each implementation step.", headers: ["Action", "Method", "Output", "Validation", "Owner", "Workstream"], rows: blank(4, 6) },
  { id: "T3", name: "RACI matrix", use: "Exactly one Accountable per activity.", headers: ["Activity", "Responsible", "Accountable", "Consulted", "Informed"], rows: blank(5, 5) },
  { id: "T4", name: "KPI and benefits tracker", use: "Track forecast, approved, validated, realised and sustained benefit separately.", headers: ["KPI", "Baseline", "Target", "Formula", "Owner", "Cadence", "Benefit status"], rows: blank(4, 7) },
  { id: "T5", name: "Risk and issue log", use: "Review at every weekly stand-up.", headers: ["Risk", "Likelihood", "Impact", "Counter-action", "Owner", "Status"], rows: blank(5, 6) },
  { id: "T6", name: "30 / 60 / 90 day plan", use: "For focused interventions.", headers: ["Horizon", "Activity", "Owner", "Milestone", "Decision gate"], rows: [["Days 0-30", "", "", "", ""], ["Days 31-60", "", "", "", ""], ["Days 61-90", "", "", "", ""]] },
  { id: "T7", name: "Stage-gate checklist", use: "Yes or no, with evidence.", headers: ["Gate", "Evidence required", "Owner", "Met or Open"], rows: blank(5, 4) },
  { id: "T8", name: "Post-implementation review", use: "Held after completion to capture results and lessons.", headers: ["Question", "Finding", "Action"], rows: [["Were outcomes achieved against the baseline?", "", ""], ["What worked and should be kept?", "", ""], ["What did not work?", "", ""], ["What must be sustained, and by whom?", "", ""]] },
];
