import type { InputItem, OutputItem, SipocText } from '@/lib/agents/sipoc';

/**
 * The six-step flow shown top to bottom on every agent page: Perceive, Context, Memory, Reason, Action, Learn.
 * The agent-specific lines come from the agent's own SIPOC and tool definition (inputs, process, outputs, refresh), so the flow can never
 * disagree with what the agent really does. The one-line meaning of each step is the same for every agent.
 */
export interface FlowStep { n: number; name: string; meaning: string; points: string[] }

const LIMIT = 4;
const some = (xs: string[]) => xs.filter((x) => x.trim()).slice(0, LIMIT);

export function flowOf(sipoc: SipocText, inputs: InputItem[], outputs: OutputItem[]): FlowStep[] {
  const results = outputs.filter((o) => o.kind === 'result').map((o) => o.label);
  return [
    { n: 1, name: 'Perceive', meaning: 'Take in the data it needs, from people, files or systems.', points: some([...sipoc.suppliers.slice(0, 2), ...inputs.map((i) => i.label)]) },
    { n: 2, name: 'Context', meaning: 'Read each figure against the units, period and assumptions you set.', points: some(inputs.filter((i) => i.kind === 'field').map((i) => (i.unit ? `${i.label} (${i.unit})` : i.label))) },
    { n: 3, name: 'Memory', meaning: 'Keep your entries so you can return, change a figure and rerun.', points: ['Your entries save as you type', 'Upload a filled Excel template to load them', 'The demo sample is never saved as your data'] },
    { n: 4, name: 'Reason', meaning: 'Work the answer out with fixed, tested formulas. AI never writes a figure.', points: some(sipoc.process) },
    { n: 5, name: 'Action', meaning: 'Hand back the result as a report you can read, print or download.', points: some([...results, 'Printable PDF report', 'Excel workbook']) },
    { n: 6, name: 'Learn', meaning: 'Refresh with new data and compare the last answer with what happened.', points: some([sipoc.refresh]) },
  ];
}
