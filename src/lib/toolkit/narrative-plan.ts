/**
 * Which sections get an AI narrative, and what each must contain.
 *
 * This file is deliberately free of server code (no AI gateway, no database), so browser-side
 * screens can import it. Everything that calls the AI lives in narrative.ts.
 */
import type { KitType } from "./engine";
export interface NarrativeSpec {
  seq: number;
  minWords: number;
  maxWords: number;
  /** what this passage must do, in the skill's terms */
  brief: string;
}

const S = (seq: number, minWords: number, maxWords: number, brief: string): NarrativeSpec => ({ seq, minWords, maxWords, brief });

/** Which sections get an AI narrative, and what each must contain. Section numbers follow the canonical contents. */
export const NARRATIVE_PLAN: Record<KitType, NarrativeSpec[]> = {
  DIAGNOSTIC: [
    S(3, 250, 400, "Executive Diagnostic Brief. Lead with the answer: what the diagnostic shows overall, then three supporting points drawn from the computed scores, gaps and findings, then the decision the sponsor must take."),
    S(6, 300, 500, "Industry and business context. Describe the business model, value chain and operating context the client gave, and why this topic matters in it. Where you use general professional knowledge, introduce it with 'General practice:'."),
    S(13, 250, 400, "Interpretation of the performance gap analysis: where the gaps are largest and why that matters. State that no external benchmark was provided unless one appears in the inputs."),
    S(14, 300, 500, "Explain the issue tree: how the weakest dimensions connect, which hypotheses to test first and how. Do not assert a cause; every cause is a hypothesis until tested."),
    S(16, 250, 400, "Opportunity assessment: describe the opportunity qualitatively by dimension. Do not state any money value unless it appears in the inputs."),
    S(17, 300, 500, "Rationale for the prioritised initiatives: why this order, what could be a quick win, and what depends on what. Frame suggestions as options for the owner to confirm."),
    S(18, 250, 400, "How to run the roadmap: what happens in the first 30, 60 and 90 days and how governance keeps it on track."),
    S(19, 300, 450, "Executive recommendations and the decisions required. Be direct. Tie every recommendation to evidence in the report and state what is not yet known."),
  ],
  PROBLEM_SOLVING: [
    S(3, 250, 400, "Executive Problem-Solving Brief. Answer first: the problem, what has been learned about its causes, the leading option and the decision needed, with the decision gate status."),
    S(7, 200, 350, "Baseline and impact commentary: what the baseline shows, what is not known, and how the impact should be quantified."),
    S(8, 200, 350, "Explain the issue tree and how it was split. Comment on whether it looks mutually exclusive and collectively exhaustive."),
    S(10, 250, 400, "How the hypotheses should be tested: for each, what evidence would confirm or reject it, and what counter-evidence to look for."),
    S(11, 250, 400, "Causal logic: connect the validated causes to the problem. Say clearly which causes are validated, which are not, and what that means for confidence."),
    S(14, 300, 500, "Options trade-off analysis: compare the leading options on the weighted criteria, note where the ranking depends on weights, and what judgement is still needed."),
    S(16, 250, 400, "Decision narrative: the recommended solution, why, the trade-offs accepted, and the status of the decision gate. Never state a decision the owner has not taken."),
    S(17, 250, 400, "Handover to the Playbook: what the implementation team must know, including constraints, success criteria and the re-route condition."),
    S(18, 200, 350, "Risks, assumptions and open questions: the ones that would change the recommendation."),
  ],
  PLAYBOOK: [
    S(3, 250, 400, "Executive Implementation Brief. Answer first: what will be implemented, why, by when, who owns it and whether it is ready to mobilise."),
    S(7, 250, 400, "Target operating state: how work will be done after implementation and how success will be seen."),
    S(8, 200, 350, "Readiness and mobilisation: what is ready, what is not, and what must happen before start."),
    S(9, 250, 400, "Implementation architecture: how the workstreams fit together, their dependencies and stage gates."),
    S(10, 250, 400, "How to run the step-by-step method: sequencing, handoffs and the validation that proves each step is done."),
    S(13, 250, 400, "Change, communications, training and adoption: who is affected, what they need to hear and when."),
    S(14, 250, 400, "Risks, dependencies and controls: how the main risks will be watched and countered."),
    S(15, 250, 400, "KPI and benefits realisation: how forecast, approved, validated, realised and sustained benefit will be tracked separately."),
    S(16, 200, 350, "Roadmap commentary: phases, milestones and the decisions at each gate."),
    S(19, 200, 350, "Post-implementation review: when, how and what will be learned and sustained."),
  ],
  GUIDE: [
    S(6, 300, 500, "Executive overview: why the topic matters to the reader's business and what the Guide will help them do."),
    S(7, 300, 500, "Introduction to the definitions and principles: how the concepts fit together, in plain language."),
    S(8, 250, 400, "Industry and functional context and use cases: where the topic applies, using the context the client gave."),
    S(9, 250, 400, "Introduction to the frameworks: how to choose between them and what each is not good for."),
    S(10, 250, 400, "Guidance on applying the steps in practice, including what good and poor application look like."),
    S(12, 250, 400, "Guidance on choosing an approach and the trade-offs, including when not to use each."),
    S(13, 250, 400, "Common mistakes and troubleshooting: why they happen and how to spot them early."),
    S(15, 200, 350, "Implementation considerations and next steps."),
  ],
  LEARNING: [
    S(3, 250, 400, "About the Learning Kit: purpose, who it is for and what learners will be able to do."),
    S(5, 200, 350, "How to use the kit: how to work through the modules and what to do between them."),
    S(6, 250, 400, "The learning journey: how the modules build on each other towards the learner outputs."),
    S(9, 300, 500, "Integrated case or capstone challenge: a realistic situation from the client's context that makes the learner perform the skill."),
    S(12, 200, 350, "Teach-back and reflection: how learners explain the ideas to someone else and what to reflect on."),
    S(14, 250, 400, "Facilitator or self-study notes: pacing, preparation, common difficulties and completion criteria."),
  ],
};

export const narrativeSpec = (type: KitType, seq: number): NarrativeSpec | undefined => NARRATIVE_PLAN[type]?.find((s) => s.seq === seq);
export const narrativeFieldId = (seq: number) => `NARR.${seq}`;
export const isNarrativeField = (fieldId: string) => fieldId.startsWith("NARR.");
