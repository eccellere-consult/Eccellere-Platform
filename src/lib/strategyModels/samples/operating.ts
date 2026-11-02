/**
 * samples/operating.ts — the worked examples for the 7-Stage Agentic AI Model, McKinsey 7S, RACI, the Balanced Scorecard,
 * OGSM and the Startup KPI Tracker, told about the fictional Anand Auto Components (Pune): revenue ₹9,800 lakh in FY 2024-25,
 * EBITDA ₹1,450 lakh, 71 debtor days, 41% of revenue from one customer, 4.8% rework with Line 2 the hotspot, OTIF 84%, about
 * 320 people. Fictional and illustrative; every figure ties to the other demos (the financial model's Year 3, the weekly
 * numbers, the 7S findings that the RACI chart answers).
 */
import type { ModelSample } from '../types';

export const OPERATING_SAMPLES: Record<string, ModelSample> = {
  agenticai: {
    scenario: 'Anand Auto Components (Pune) — placing the business on the AI ladder before deciding what to connect first.',
    values: {
      current_usage: 'Eight people in sales, purchase and quality use ChatGPT to draft emails, summarise tender documents and tidy meeting notes. There is a shared prompts document but nobody owns it, and nothing is connected to the ERP or the quality system. Customer drawings are sometimes pasted into public chat tools.',
      target_stage: 'Event and schedule connections',
      target_why: 'Within twelve months, weekly debtor reminders and RFQ triage should run on a schedule without anyone remembering to start them: each day of debtor days is about ₹27 lakh of cash, and a missed RFQ is a lost programme.',
      blockers: 'Nobody owns the prompt library; the way quotes and debtor follow-ups are done is in people’s heads, so there is nothing to write down as a skill yet; the rules on customer data are unclear; the ERP exports are manual.',
      next_moves: '1. Name an owner for the prompt library and move it to one managed place (Sales Head, within 30 days).\n2. Turn the quote-review prompts into one three-step workflow and run it on the next five RFQs (Sales Head, within 60 days).\n3. Write the debtor follow-up routine as a skill file: who is chased, what is said, when it escalates (Finance Head, within 90 days).',
      guardrails: 'No customer drawings or price lists in public chat tools; a named person reviews every customer-facing message the AI drafts; the MD approves any use that touches payment terms or prices.',
      notes: '',
    },
    tables: {
      stages: [
        { stage: 'Prompt marketplace', status: 'In regular use', evidence: 'Eight people use shared prompts every week for emails and tender summaries; the library is one document with no owner.' },
        { stage: 'Prompt workflows', status: 'Trying it', evidence: 'Sales has chained three prompts (read the RFQ, list the risks, draft the reply) on two RFQs; it saves about two hours a quote but is not written down.' },
        { stage: 'skill.md', status: 'Not started', evidence: 'How quotes, 8D reports and debtor follow-ups are done is in the IATF procedures and in people’s heads; none of it is written as a skill the AI can follow.' },
        { stage: 'Event and schedule connections', status: 'Not started', evidence: 'Nothing runs on a trigger or a schedule; the ERP exports are downloaded by hand.' },
        { stage: 'Flow orchestration', status: 'Not started', evidence: 'No flows across tools; approvals are by phone and WhatsApp.' },
        { stage: 'Autonomous operation', status: 'Not started', evidence: 'No work is done end to end by an agent; the quality team would not accept it without a named checker.' },
        { stage: 'Coded agents', status: 'Not started', evidence: 'There is no in-house development capability for agents; an outside partner would be needed.' },
      ],
    },
    why: {
      current_usage: 'Taken from the Value Scan, then checked against what people actually do each week.',
      stages: 'Each status has a real example beside it, so “in regular use” means someone does it every week, not that it is planned.',
      target_stage: 'The target is three rungs up, not the top: it is the first rung that removes a manual step from cash collection.',
      guardrails: 'Written before the first connection goes live, because the risk grows with every rung.',
    },
    analysis: {
      summary: 'Anand is at Stage 1 — Prompt marketplace: eight people use shared prompts every week, and sales has begun chaining three prompts into a quote-review routine (Stage 2, still being tried). Nothing is written down as a skill, nothing runs on a trigger or a schedule, and there are no guardrails. The target — Stage 4, event and schedule connections, within twelve months — is three rungs up and is reachable only if Stage 3 is not skipped, because debtor reminders and RFQ triage can be automated only once someone has written down how they are done.',
      verdict: {
        label: 'Stage 1 today; aim for Stage 4, but write the skills first',
        rationale: 'The ladder is climbed one rung at a time: Stage 2 is in trial, Stage 3 has not started, and Stage 4 depends on both.',
      },
      findings: [
        { title: 'Real use, no ownership', detail: 'Eight people use shared prompts weekly, which is genuine Stage 1, but the library has no owner and customer drawings are sometimes pasted into public tools — a risk that grows with every rung.' },
        { title: 'The best Stage 2 candidate is already running', detail: 'The three-prompt quote-review chain saves about two hours a quote on two RFQs; making it a documented workflow for every RFQ is the cheapest step up.' },
        { title: 'Stage 3 is the real gap', detail: 'The quote, 8D and debtor follow-up routines exist in the IATF procedures and in people’s heads; turning the two that matter most into skill files is what makes Stage 4 possible.' },
        { title: 'The target is tied to a number', detail: 'Weekly debtor reminders sent on a schedule support the plan to bring debtor days from 71 to 60; each day is about ₹27 lakh of cash today.' },
      ],
      watchouts: [
        'Moving to Stage 4 before Stage 3 would automate routines nobody has agreed on, so mistakes would be repeated faster.',
        'Anything that runs on a schedule and writes to customers is a reputational risk without a named checker; guardrails should be in place before the first connection goes live.',
        'Eight enthusiastic users are not yet a capability: if the two most active people leave, Stage 1 use could drop quickly because the prompts are not owned or kept in one place.',
      ],
    },
    recommendations: [
      'Name an owner for the prompt library this month and move it to one managed place, with a rule that no customer drawings go into public chat tools.',
      'Turn the three-prompt quote-review chain into a written workflow and run it on the next five RFQs, timing each one, before deciding to roll it out.',
      'Write the debtor follow-up routine as a skill file — who is chased, what is said, when it escalates — and have Finance check its drafts for a month before it is put on a schedule.',
      'Set the Stage 4 target against a number the business already tracks: weekly debtor reminders sent on a schedule, judged by debtor days (71 now, 60 in the plan).',
    ],
    actionables: [
      { action: 'Name an owner for the shared prompt library and set the rule on customer drawings in public chat tools', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Document the three-prompt quote-review chain and time it on the next five RFQs', owner: 'Sales Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Write the debtor follow-up routine as a skill file and have Finance check its drafts every week', owner: 'Finance Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Agree who checks AI output before anything goes to a customer', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'Medium' },
    ],
  },

  sevens: {
    scenario: 'Anand Auto Components (Pune) — checking whether the organisation has kept pace with the growth strategy.',
    values: {
      size_band: '201–500',
      ai_position: 'Stage 1 — Prompt marketplace today; target Stage 4 — Event and schedule connections; next rung Stage 2 — Prompt workflows',
      main_misfit: 'Structure and style. The strategy needs the four heads to run the bracket programme and cash collection themselves, but every decision still queues for the MD, who then has no time left for the programme work that wins the next contract. Fixing systems or skills first would not help while decisions wait.',
      first_changes: 'Agree a RACI for the ten decisions that queue most (Operations Head, within 45 days); appoint a programme lead for the bracket line (Managing Director, within 60 days); put “ask before you answer” into the MD’s own plant walk (Managing Director, from now).',
      notes: '',
    },
    tables: {
      elements: [
        { element: 'Strategy', today: 'Grow welded brackets and engineering-led work, fix Line 2 rework and collect faster. It is written in the board plan and understood by the four heads, less so by supervisors.', alignment: 'Aligned', change: '' },
        { element: 'Structure', today: 'About 320 people, run as one flat team: the MD takes most daily decisions and the four heads report straight to the MD. Plant supervisors have no deputy and nobody owns the new bracket line.', alignment: 'Misaligned', change: 'Add a plant manager for each shift block and a programme lead for brackets, and move daily decisions below the MD.' },
        { element: 'Systems', today: 'The ERP covers invoicing and stock, but quotes, rework data and debtor follow-ups sit in spreadsheets and WhatsApp; there is no single view of rework by line.', alignment: 'Partially aligned', change: 'Capture rework by line and shift in the ERP and keep one debtor list reviewed every week.' },
        { element: 'Shared values', today: 'Quality and loyalty are real values: long-serving machinists and little attrition in the plant. But “the MD decides” is also a value, and people wait to be told.', alignment: 'Partially aligned', change: 'Make “fix it at the line” an explicit value and recognise people who stop a bad part.' },
        { element: 'Skills', today: 'Strong in precision machining and tooling design; weaker in welding process control, in finance for non-finance managers and in using data.', alignment: 'Partially aligned', change: 'Welding process training for Line 2 and a basic finance course for the four heads.' },
        { element: 'Style', today: 'Hands-on and fast: the MD walks the plant every day. It wins trust but means decisions queue for the MD, and the heads rarely challenge in meetings.', alignment: 'Misaligned', change: 'Agree which decisions each head owns, and a rule that the MD asks before answering.' },
        { element: 'Staff', today: 'Experienced machinists and welders and a young engineering team, but high turnover among welders on the Line 2 shift and a thin bench of supervisors.', alignment: 'Partially aligned', change: 'A supervisor development track and a retention plan for welders.' },
      ],
    },
    why: {
      elements: 'Every rating has a sentence of evidence beside it, and the ones that are not aligned say what would change.',
      main_misfit: 'It names the two elements that block the strategy first, and why the others can wait.',
      ai_position: 'From the AI ladder: it speaks directly to Systems and Skills.',
    },
    analysis: {
      summary: 'Anand’s strategy is clear and understood by the four heads, but the organisation around it has not kept up: of the seven elements one is aligned, four are partly aligned and two — structure and style — are misaligned. At about 320 people the business is still run as one flat team under the MD, so decisions queue and nothing frees the MD to lead the bracket programme. The centre, shared values, is only partly aligned: quality is a real value, but “the MD decides” is one too.',
      verdict: {
        label: 'The strategy is sound; structure and style are what will stop it',
        rationale: 'The hard S’s are mostly in order (one of three aligned, the others fixable), but none of the four soft S’s is fully aligned and the two misalignments, structure and style, reinforce each other.',
      },
      findings: [
        { title: 'Structure and style are one problem', detail: 'A flat structure and a hands-on style both route decisions to the MD; changing the structure without the style, or the reverse, would leave the queue in place.' },
        { title: 'The centre needs attention', detail: 'Shared values are partly aligned: quality and loyalty are strong, but “the MD decides” teaches people to wait, which works against the faster decisions the strategy needs.' },
        { title: 'Systems cost time, not only money', detail: 'Rework by line and the debtor list live in spreadsheets, so the two things the strategy most needs to see — Line 2 rework and collections — are seen late.' },
        { title: 'The soft S’s carry the risk', detail: 'None of skills, style, staff or shared values is fully aligned, and they decide whether a change in structure and systems will stick.' },
      ],
      watchouts: [
        'The ratings are the management team’s own view; supervisors and welders have not been asked how decisions and style look from the shop floor.',
        'Adding managers without changing the MD’s own habits would add cost and leave the queue.',
        'Welder turnover on the Line 2 shift may be a symptom of supervision rather than pay; check that before a retention bonus is set.',
      ],
    },
    recommendations: [
      'Fix structure and style together: name a programme lead for the bracket line and agree which decisions each head owns, so the queue at the MD shortens in the same quarter.',
      'Write the ownership down as a RACI for the ten decisions that queue most, and review it with the four heads before it goes to supervisors.',
      'Put “ask before you answer” into the MD’s daily plant walk: for a month, ask the supervisor what they would do before giving the decision.',
      'Capture rework by line and shift in the ERP and review it weekly with the Operations Head, so the biggest strategic risk is visible the day it happens.',
    ],
    actionables: [
      { action: 'List the ten decisions that queue most at the MD and assign an owner to each in a RACI', owner: 'Operations Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Appoint a programme lead for the welded-bracket line', owner: 'Managing Director', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Capture rework by line and shift in the ERP and review it every Monday', owner: 'Quality Head', timeframe: 'Within 60 days', priority: 'Medium' },
      { action: 'Ask supervisors and welders, in small groups, how decisions and style look from the shop floor', owner: 'HR Lead', timeframe: 'Within 90 days', priority: 'Low' },
    ],
  },

  raci: {
    scenario: 'Anand Auto Components (Pune) — putting names against the decisions the 7S review found queueing at the MD.',
    values: {
      scope: 'Order-to-cash, quality and capital decisions — the ones that queue most at the MD',
      from_7s: 'Structure: about 320 people run as one flat team under the MD, supervisors have no deputy. Style: the MD walks the plant and answers most questions personally, so decisions queue. Staff: a thin bench of supervisors.',
      people: 'Managing Director (MD); Operations Head; Sales Head; Finance Head; Quality Head; HR Lead; Purchase Manager; plant managers (Lines 1 and 2); programme lead for brackets (to be appointed)',
      rules: 'Where two heads disagree, the Operations Head decides within two days for plant matters and the MD for price and capital; the chart is reviewed with the four heads every six months and after any change of structure.',
      notes: '',
    },
    tables: {
      decisions: [
        { decision: 'Approve a price change above 5%', responsible: 'Sales Head', accountable: 'Managing Director', consulted: 'Finance Head', informed: 'Plant managers' },
        { decision: 'Release a purchase order above ₹5 lakh', responsible: 'Purchase Manager', accountable: 'Finance Head', consulted: 'Operations Head', informed: 'Managing Director' },
        { decision: 'Stop a line for a quality escape', responsible: 'Quality Head', accountable: 'Operations Head', consulted: 'Plant managers', informed: 'Managing Director, Sales Head' },
        { decision: 'Accept a customer return or debit note', responsible: 'Quality Head', accountable: 'Sales Head and Quality Head', consulted: 'Finance Head', informed: 'Managing Director' },
        { decision: 'Approve capital spending above ₹25 lakh', responsible: 'Operations Head', accountable: 'Managing Director', consulted: 'Finance Head', informed: 'Board' },
        { decision: 'Hire or replace a supervisor', responsible: 'HR Lead', accountable: '', consulted: 'Operations Head', informed: 'Managing Director' },
        { decision: 'Chase an overdue debtor', responsible: 'Finance Head', accountable: 'Finance Head', consulted: 'Sales Head', informed: 'Managing Director' },
        { decision: 'Start a new bracket programme', responsible: 'Programme lead (to be appointed)', accountable: 'Managing Director', consulted: 'Operations Head, Finance Head', informed: 'Sales Head' },
        { decision: 'Approve overtime and weekend shifts', responsible: 'Plant managers', accountable: 'Operations Head', consulted: 'HR Lead', informed: 'Managing Director' },
      ],
    },
    why: {
      scope: 'It is limited to the decisions the 7S review said queue, so the chart can be finished and used.',
      decisions: 'Each row is one specific decision with named roles; the two rows that break the rule are left as they are, because they are the finding.',
      rules: 'A tie-break and a review date, so the chart does not become another document nobody opens.',
    },
    analysis: {
      summary: 'Seven of the nine decisions now have exactly one accountable owner, and the MD is accountable for three of them — price changes above 5%, capital above ₹25 lakh and new programmes — which is what the 7S review asked for: fewer decisions queueing at the top. Two decisions still break the rule: customer returns name two accountable heads (Sales and Quality), and nobody is accountable for hiring or replacing a supervisor, the very gap the 7S review found in staffing.',
      verdict: {
        label: 'Mostly clear — fix the two decisions with no single owner',
        rationale: 'Seven of nine decisions have one accountable owner and the load is spread (the MD holds three of seven), but customer returns and supervisor hiring have no single owner.',
      },
      findings: [
        { title: 'The two broken rows are the real finding', detail: 'Customer returns name two accountable heads and supervisor hiring names none; both queue at the MD today, so they are where the old problem will come back.' },
        { title: 'The load is better spread', detail: 'The MD is accountable for 3 of the 7 decisions with one owner, the Finance Head and the Operations Head for 2 each: nobody holds half of them.' },
        { title: 'The Finance Head is consulted a lot', detail: 'The Finance Head is consulted on four of the nine decisions and accountable for two; someone who is both the most consulted and an owner can become the next bottleneck.' },
        { title: 'Two decisions are missing', detail: 'There are no rows for engineering changes or for changing a supplier, both of which wait for the MD today.' },
      ],
      watchouts: [
        'The chart shows who should own each decision, not who does today; the plant managers and supervisors have not yet seen it.',
        'Two roles are still to be filled — the programme lead for brackets and the purchase manager — so those Responsible cells are plans, not people.',
        'Writing the chart does not change behaviour on its own: the MD’s habit of answering every question has to change with it.',
      ],
    },
    recommendations: [
      'Split customer returns into two rows with one owner each: the Quality Head accepts or rejects the claim, and the Sales Head settles it with the customer.',
      'Name one accountable owner for hiring or replacing a supervisor — the Operations Head for plant roles — and take it off the MD’s list for good.',
      'Add rows for engineering changes and for changing a supplier, the two decisions the 7S review found waiting for the MD, before the chart goes to the plant.',
      'Appoint the programme lead and the purchase manager by name, then walk the chart through with the plant managers and supervisors and ask where it does not match how decisions are really made.',
    ],
    actionables: [
      { action: 'Split the customer-return row into an accept-or-reject decision for the Quality Head and a settlement decision for the Sales Head', owner: 'Managing Director', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Name the accountable owner for hiring or replacing a supervisor and record it in the chart', owner: 'Operations Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Add rows for engineering changes and supplier changes, with R, A, C and I for each', owner: 'Quality Head', timeframe: 'Within 45 days', priority: 'Medium' },
      { action: 'Walk the chart through with the plant managers and supervisors and note where it differs from practice', owner: 'HR Lead', timeframe: 'Within 60 days', priority: 'Medium' },
    ],
  },

  bsc: {
    scenario: 'Anand Auto Components (Pune) — turning the growth plan into a scorecard the four heads can steer by.',
    values: {
      strategy: 'Grow welded brackets and engineering-led tooling work, fix Line 2 rework and collect faster — funded from the cash the core machining business already earns.',
      financial_plan: 'Revenue ₹9,800 lakh → ₹14,385 lakh by year 3 (13.6% a year); EBITDA margin 14.8% → 16.5%; net profit ₹1,263 lakh; lowest cash ₹535 lakh in Year 1',
      ai_readiness: 'Stage 1 — Prompt marketplace today; target Stage 4 — Event and schedule connections; next rung Stage 2 — Prompt workflows',
      weekly_kpis: 'RFQs received; quotes sent within 3 days (%); OTIF to the anchor OEMs (%); Line 2 rework (%); debtor days',
      strategy_map: 'Supervisor bench and written AI routines → faster quoting and less rework → more programmes won and on-time deliveries → revenue, margin and cash. A supervisor bench also frees the MD to lead the bracket programme.',
      balance_view: 'Results (revenue, margin, OTIF) are matched by drivers (rework, quote speed, AI stage), and short-term collection targets by longer-term objectives on skills and structure. Learning and growth has the fewest hard numbers and needs a baseline.',
      notes: '',
    },
    tables: {
      perspectives: [
        { perspective: 'Financial', objectives: 'Grow profitably\nFree up cash from debtors', measures: 'Revenue (₹ lakh) and EBITDA margin (%)\nDebtor days', targets: '₹14,385 lakh and 16.5% by FY 2027-28\n60 days by FY 2027-28', initiatives: 'Second welding line for brackets; index-linked pricing; debtor-days programme' },
        { perspective: 'Customer', objectives: 'Be the OEMs’ first-choice supplier for brackets\nWin the next two programmes', measures: 'OTIF to the anchor OEMs (%)\nProgrammes won', targets: '92% within 12 months\nTwo by March 2027', initiatives: 'Daily 4 pm OTIF review; quarterly OEM scorecard review; the two bid-stage contracts' },
        { perspective: 'Internal process', objectives: 'Cut rework on Line 2\nQuote faster', measures: 'Line 2 rework rate (%)\nQuotes sent within 3 days (%)', targets: 'From 5.4% to 2% by March 2027\n90% by September 2026', initiatives: 'Welding fixture fix and process-control training; quote-review workflow' },
        { perspective: 'Learning and growth', objectives: 'Build the supervisor bench\nMove AI use from prompts to written skills', measures: 'Supervisors with a named deputy\nAI stage reached', targets: 'All six lines by March 2027\nStage 4 within 12 months', initiatives: 'Welding process training; the 7S changes to structure; prompt-library owner and skill files' },
      ],
    },
    why: {
      financial_plan: 'The targets are the Year 3 figures of the financial model, so the scorecard and the plan cannot disagree.',
      perspectives: 'Each row has an objective, a measure and a target; the measures come from the weekly numbers wherever they can.',
      strategy_map: 'It states the chain from the supervisor bench to cash, so a measure that does not sit on the chain stands out.',
    },
    analysis: {
      summary: 'The scorecard turns Anand’s plan into eight objectives across the four perspectives, each with a measure and a target, and links them by cause and effect: a supervisor bench and written AI routines speed up quoting and cut rework, which win programmes and on-time deliveries, which produce the revenue and cash in the financial plan. It is complete and balanced for a first version, and its financial targets (₹14,385 lakh revenue, 16.5% EBITDA margin, 60 debtor days) are taken directly from the three-statement model. Learning and growth is the weakest perspective: its measures have no baseline yet.',
      verdict: {
        label: 'A balanced first scorecard — baseline the learning measures',
        rationale: 'All four perspectives are complete and linked by cause and effect, and the financial targets follow the model; the learning and growth measures have no starting value yet.',
      },
      findings: [
        { title: 'The financial targets come from the model', detail: 'Revenue ₹14,385 lakh, EBITDA margin 16.5% and 60 debtor days by FY 2027-28 are the Year 3 figures of the three-statement model, so finance and the scorecard say the same thing.' },
        { title: 'Drivers match results', detail: 'Each customer and financial result has a driver beneath it: OTIF follows the delivery routine and rework, programmes won follow quote speed, and revenue follows programmes won.' },
        { title: 'The weekly numbers are reused', detail: 'Four measures — OTIF, Line 2 rework, quotes within three days and debtor days — are already tracked every Monday, so the scorecard starts with data rather than a new reporting burden.' },
        { title: 'Learning and growth has no baseline', detail: 'Supervisors with a deputy and AI stage reached are the right measures, but today’s values are not written down, so progress cannot be shown yet.' },
      ],
      watchouts: [
        'Eight objectives is modest for a first scorecard, but each one added competes for the heads’ attention; resist adding more before the first review.',
        'The targets are management estimates; the OTIF and rework targets are ambitious against today’s 84% and 5.4% and have not been tested with the operations team.',
        'There is no measure of the EV pilots, so the longer-term bet would not appear on the scorecard.',
      ],
    },
    recommendations: [
      'Write down today’s value for every measure — supervisors with a deputy, AI stage, programmes won — so the first review shows movement from a baseline.',
      'Review the scorecard monthly with the four heads, starting with Line 2 rework and debtor days, the two measures that most affect cash.',
      'Pass the objectives to the OGSM so the one-page plan and the scorecard use the same wording, and to the OKRs for the quarterly key results.',
      'Add one measure for the EV pilots (for example, paid pilot programmes) so the longer-term bet is visible without crowding the page.',
    ],
    actionables: [
      { action: 'Record today’s baseline for each of the eight measures', owner: 'Finance Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Set the monthly scorecard review and agree who presents each perspective', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Test the OTIF and rework targets with the Operations Head and the plant managers', owner: 'Operations Head', timeframe: 'Within 45 days', priority: 'Medium' },
      { action: 'Agree one measure for the EV pilots', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  ogsm: {
    scenario: 'Anand Auto Components (Pune) — putting the plan on one page for the four heads and the board.',
    values: {
      objective: 'Become the OEMs’ first-choice supplier for welded brackets while keeping the core machining business strong and cash-generative.',
      review: 'A one-hour review each month with the four heads, scorecard first and OGSM second; the MD signs off any change to a goal; a full refresh each March.',
      notes: '',
    },
    tables: {
      goals: [
        { goal: 'Revenue', target: '₹14,385 lakh', by_when: 'FY 2027-28' },
        { goal: 'EBITDA margin', target: '16.5%', by_when: 'FY 2027-28' },
        { goal: 'On-time-in-full delivery to the anchor OEMs', target: '92%', by_when: 'Within 12 months' },
        { goal: 'Debtor days', target: '60 days', by_when: 'FY 2027-28' },
      ],
      strategies: [
        { strategy: 'Build the second welding line against signed bracket volumes', supports: 'Goal 1', measure: 'Signed bracket volumes before the line order is released', target: 'Two OEM contracts', owner: 'Operations Head' },
        { strategy: 'Fix Line 2 welding rework with a new fixture and process control', supports: 'Goal 2', measure: 'Line 2 rework rate (%)', target: '2%', owner: 'Quality Head' },
        { strategy: 'Make delivery performance a daily routine', supports: 'Goal 3', measure: 'OTIF to the anchor OEMs (%)', target: '92%', owner: 'Operations Head' },
        { strategy: 'Collect faster with a debtor-days programme', supports: 'Goal 4', measure: 'Debtor days', target: '60', owner: 'Finance Head' },
        { strategy: 'Free the MD to lead growth by moving daily decisions to the heads and plant managers', supports: 'Goal 1', measure: 'Decisions queued at the MD each week', target: 'Under 5', owner: 'Managing Director' },
      ],
    },
    why: {
      objective: 'A direction with no number in it, taken from the scorecard’s customer and financial objectives.',
      goals: 'The goals are the scorecard’s targets, so the one-page plan and the scorecard cannot disagree.',
      strategies: 'Each strategy is a choice of how, with the one measure that shows it is working and one owner.',
    },
    analysis: {
      summary: 'The plan fits on one page: one objective, four goals each with a number and a date, and five strategies, each with a measure, a target and one owner. Every goal has a strategy, every strategy is complete, and the goals match the scorecard and the financial model. What it lacks is a strategy for pricing: the margin goal rests on the rework fix alone, although the financial plan also relies on index-linked pricing to pass steel moves through to customers.',
      verdict: {
        label: 'A clear one-page plan — add a pricing strategy for the margin goal',
        rationale: 'Every goal has a strategy and every strategy a measure, a target and an owner, but the margin goal depends on index-linked pricing that no strategy owns.',
      },
      findings: [
        { title: 'The chain is complete', detail: 'Four goals and five strategies, each with a measure, a target and one owner: nothing is left without an owner and the plan fits on one page.' },
        { title: 'The margin goal rests on one strategy', detail: 'EBITDA margin from 14.8% to 16.5% depends on the rework fix and on index-linked pricing, but only rework appears as a strategy; pricing has no owner.' },
        { title: 'The goals match the other tools', detail: 'Revenue ₹14,385 lakh, margin 16.5%, OTIF 92% and 60 debtor days are the same numbers as in the financial model and the scorecard.' },
        { title: 'One strategy measures a symptom', detail: 'Decisions queued at the MD each week shows the change in structure but not what it frees the MD to do; add the number of bracket-programme milestones met.' },
      ],
      watchouts: [
        'The objective has no date; it is a direction, which is right, but the review should say when it is judged.',
        'Strategies 1 and 5 both support Goal 1 while Goal 2 has only one; check the balance of effort against where the numbers are hardest.',
        'The Operations Head owns two of the five strategies on top of the structure and RACI changes; the load needs watching.',
      ],
    },
    recommendations: [
      'Add a pricing strategy — index-linked pricing on all new contracts — owned by the Sales Head, with a measure such as the share of revenue under index-linked terms.',
      'Add a bracket-programme milestone measure to the strategy on freeing the MD, so it shows what the time is for.',
      'Date the objective in the review: judge it each March against the four goals.',
      'Check the Operations Head’s load, as owner of two of the five strategies, before the plan goes to the board.',
    ],
    actionables: [
      { action: 'Add a pricing strategy with the Sales Head as owner and a measure for revenue under index-linked terms', owner: 'Managing Director', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Add a bracket-programme milestone measure beside “decisions queued at the MD”', owner: 'Strategy Lead', timeframe: 'Within 45 days', priority: 'Medium' },
      { action: 'Review the plan with the four heads and agree the monthly review slot', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'Medium' },
      { action: 'Take the one-page plan to the board for sign-off', owner: 'Managing Director', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  startupkpis: {
    scenario: 'Anand Auto Components (Pune) — the five numbers the four heads read every Monday, before any scorecard exists.',
    values: {
      north_star: 'OTIF to the two anchor OEMs (%)',
      cadence: 'Weekly',
      week_summary: 'Enquiries, quote speed and OTIF are all up and debtor days eased by a day, but Line 2 rework rose to 5.4%: fix the welding fixture before anything else.',
      notes: '',
    },
    tables: {
      kpis: [
        { metric: 'RFQs received', stage: 'Acquisition', this_week: '8', last_week: '6', good: 'Up is good', what_changed: 'Two came from the new EV start-ups' },
        { metric: 'Quotes sent within 3 days (%)', stage: 'Activation', this_week: '75', last_week: '62', good: 'Up is good', what_changed: 'The quote-review chain was used on three RFQs' },
        { metric: 'OTIF to the anchor OEMs (%)', stage: 'Retention', this_week: '86', last_week: '84', good: 'Up is good', what_changed: 'The 4 pm review caught two late orders' },
        { metric: 'Line 2 rework (%)', stage: 'Cash or operations', this_week: '5.4', last_week: '5.1', good: 'Down is good', what_changed: 'One shift ran the old fixture' },
        { metric: 'Debtor days', stage: 'Revenue', this_week: '71', last_week: '72', good: 'Down is good', what_changed: 'One large payment arrived early' },
      ],
    },
    why: {
      north_star: 'It is a number the OEMs score every quarter, so it rises only when customers genuinely get what they ordered, on time.',
      kpis: 'Each metric has a direction of good and a cause beside it, so the movement can be read without a meeting.',
      cadence: 'Weekly, on Monday, so the numbers are always of the same week.',
    },
    analysis: {
      summary: 'Four of the five weekly numbers moved the right way this week: enquiries rose from 6 to 8, quotes sent within three days from 62% to 75%, OTIF from 84% to 86% and debtor days eased from 72 to 71. The one that moved the wrong way is Line 2 rework, up from 5.1% to 5.4%, which is also the number the strategy most depends on. The North Star, OTIF to the two anchor OEMs, is the right choice for a supplier whose customers score it every quarter; the set follows the customer from enquiry to cash but has nothing for referral.',
      verdict: {
        label: 'A good weekly set — act on Line 2 rework first',
        rationale: 'Four of five metrics moved the right way, but the one that moved the wrong way is the one the growth plan depends on.',
      },
      findings: [
        { title: 'The North Star is the right one', detail: 'OTIF to the anchor OEMs rises when customers get what they ordered on time, is scored by the OEMs every quarter, and moved from 84% to 86% this week.' },
        { title: 'The set follows the customer to cash', detail: 'Enquiries, quote speed, delivery, rework and debtor days cover the path from first contact to payment; each has a clear direction of good and can be read on Monday.' },
        { title: 'Quote speed jumped for a reason', detail: 'Quotes sent within three days rose from 62% to 75% in the week the quote-review chain was used on three RFQs; the cause is named, which is what makes the number useful.' },
        { title: 'One metric is moving the wrong way', detail: 'Line 2 rework rose from 5.1% to 5.4% (up 6%) after one shift ran the old fixture; it is the metric the second welding line depends on.' },
      ],
      watchouts: [
        'Referral is not tracked, although new EV start-up business may come mostly by introduction.',
        'One week of movement is noise: with eight RFQs a week a change of two is 33%, so read the four-week trend before acting on it.',
        'Five metrics is the upper limit; the Balanced Scorecard will need these plus longer-cycle measures such as programmes won and gross margin.',
      ],
    },
    recommendations: [
      'Take Line 2 rework to the Monday meeting as the first item until it is back under 5%, and record the shift and the fixture for each reject so the cause is visible.',
      'Add a four-week average beside each metric so one good or bad week does not drive decisions.',
      'Add a referral metric — introductions from OEMs and start-ups each month — if the EV tooling studio goes ahead.',
      'Use these five numbers as the starting measures for the Balanced Scorecard rather than inventing new ones.',
    ],
    actionables: [
      { action: 'Make Line 2 rework the first item of the Monday review and record the shift and fixture for each reject', owner: 'Operations Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Add a four-week average column beside each metric in the weekly sheet', owner: 'Finance Head', timeframe: 'Within 30 days', priority: 'Medium' },
      { action: 'Agree a referral metric (introductions each month) before the EV tooling pilots start', owner: 'Sales Head', timeframe: 'Within 60 days', priority: 'Medium' },
      { action: 'Hand the five metrics to the Balanced Scorecard as its starting measures', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },
};
