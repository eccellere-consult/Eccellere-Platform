/**
 * declarativeExamples.test.ts — three complete tools written as DATA, the way an admin or an AI would add them from a deck, covering the three
 * shapes most of a 150-tool deck takes: a 2x2 decision model (a grid board with a matching diagram), a checklist method (fixed rows and a step
 * diagram) and a six-box canvas (fixed rows and a canvas diagram). Each passes the quality gate, runs through the whole engine, and draws a
 * diagram that meets the house rules. They are the patterns reference 10 tells a drafter to copy. Originators are left blank on purpose: they are
 * filled in only from a source that was opened.
 */
import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, type DeclarativeTool } from '../lib/strategyModels/declarative';
import { renderDiagram } from '../lib/strategyModels/diagrams/templates';
import { quadrantOf, regionList } from '../lib/strategyModels/boards';
import { strategyKit } from '../lib/strategyModels/kit';
import { cleanTable, computeDerived, computeOutputs, fieldsFromValues, valuesFromFields } from '../lib/strategyModels/values';
import { isTable, type ModelValues, type TablePart } from '../lib/strategyModels/types';

const base = { schema: 1 as const, source: { draftedBy: 'human' as const } };

/** 1. A 2x2 decision model: tasks placed by urgency and importance. The board is the workspace; the matrix2x2 diagram is the reference picture. */
export const eisenhower: DeclarativeTool = {
  ...base, slug: 'urgent-important-matrix', name: 'Urgent-Important matrix', category: 'prioritisation', stage: 'Decide',
  does: 'Sorts a list of tasks into four boxes by how urgent and how important each is, so the day goes to what matters.',
  whenToUse: 'When everything seems to be on fire and you need to decide what to do first, what to schedule and what to drop.',
  whenNotToUse: 'When the tasks depend on each other in a fixed order; sequence them first.',
  next: 'The tasks in Do first become the plan for the week.',
  reference: { originator: '', year: '', summary: 'Places each task by two ratings, urgency and importance, which gives four boxes with four different answers: do it now, plan it, hand it on, or drop it.', caption: 'Important and not urgent is where the real work is planned.', howToRead: ['Rate each task for urgency (does it need doing soon?) and importance (does it matter to the goal?).', 'Do first what is urgent and important; plan what is important but not urgent; hand on what is urgent but not important; drop the rest.'] },
  diagram: { template: 'matrix2x2', title: 'The urgent-important matrix', xAxis: { label: 'Urgency', low: 'can wait', high: 'needs doing soon' }, yAxis: { label: 'Importance', low: 'matters little', high: 'matters a lot' },
    quadrants: [{ name: 'Schedule', hint: 'Important, not urgent: plan it', tone: 'warn' }, { name: 'Do first', hint: 'Important and urgent: now', tone: 'good' }, { name: 'Drop', hint: 'Neither: stop doing it', tone: 'neutral' }, { name: 'Hand on', hint: 'Urgent, not important: delegate', tone: 'bad' }] },
  sections: [{ key: 'tasks', title: 'The tasks', summary: 'List each task, then place it.', parts: [
    { kind: 'field', key: 'goal', label: 'The goal these tasks serve', type: 'text', help: 'What you are trying to achieve, in a few words.', example: 'Cut weld rework to 2%' },
    { kind: 'table', key: 'tasks', label: 'Tasks', help: 'One note per task. Drag it, or set the two ratings.', rowLabel: 'Task', columns: [], maxRows: 30,
      board: { spec: { layout: 'grid', noteLabel: 'task', noteColumn: 'task', xColumn: 'urgency', yColumn: 'importance', axes: { x: { label: 'Urgency', low: 'can wait', high: 'needs doing soon' }, y: { label: 'Importance', low: 'matters little', high: 'matters a lot' } },
        quadrants: [{ name: 'Schedule', xHigh: false, yHigh: true }, { name: 'Do first', xHigh: true, yHigh: true }, { name: 'Drop', xHigh: false, yHigh: false }, { name: 'Hand on', xHigh: true, yHigh: false }], maxNoteChars: 120 }, scale: { min: 1, max: 5 } } },
  ] }],
  derived: [{ key: 'task_count', label: 'Tasks listed', rule: { op: 'calc', expr: { agg: 'count', table: 'tasks', col: 'task' }, format: 'int' } }],
  outputs: [{ key: 'goal', label: 'The goal', rule: { op: 'template', text: '{goal}' } }, { key: 'task_count', label: 'Number of tasks', rule: { op: 'calc', expr: { agg: 'count', table: 'tasks', col: 'task' }, format: 'int' } }],
  analysisGuide: 'The verdict is what to do first. List the tasks in Do first, check each really is both urgent and important, and say what in Schedule is being starved by the urgent. Flag a Do first box with more tasks than one person can finish this week.',
  sample: { scenario: 'The week after the weld rework was found.', values: { goal: 'Cut weld rework to 2%' }, tables: { tasks: [
    { task: 'Fit a separate regulator at W4', urgency: '5', importance: '5' }, { task: 'Add a utilities check to the station-add checklist', urgency: '2', importance: '5' },
    { task: 'Reply to the customer audit email', urgency: '5', importance: '2' }, { task: 'Repaint the bay markings', urgency: '1', importance: '1' } ] } },
};

/** 2. A checklist method: a fixed set of prompts, each answered with ideas. The step diagram shows the order; a rule counts the prompts answered. */
export const scamper: DeclarativeTool = {
  ...base, slug: 'scamper-prompts', name: 'SCAMPER prompts', category: 'creative', stage: 'Analyse',
  does: 'Asks seven questions about an existing product, process or idea so a team finds changes it would not have thought of.',
  whenToUse: 'When you need new ideas for something that already exists and the team keeps repeating the same ones.',
  whenNotToUse: 'When the problem is not yet understood; find the cause first.',
  reference: { originator: '', year: '', summary: 'Seven prompts, each starting with a verb, push a team to change the thing in hand in a different direction each time.', caption: 'One question at a time; collect ideas first and judge them later.', howToRead: ['Take the prompts in order and write every idea, however odd.', 'Pick the best idea from each prompt only after all seven have been tried.'] },
  diagram: { template: 'steps', title: 'The seven SCAMPER prompts', steps: [{ name: 'Substitute' }, { name: 'Combine' }, { name: 'Adapt' }, { name: 'Modify' }, { name: 'Put to other use' }, { name: 'Eliminate' }, { name: 'Reverse' }], caption: 'Work through the prompts in order.' },
  sections: [{ key: 'prompts', title: 'The prompts', summary: 'Answer each question for the thing you are improving.', parts: [
    { kind: 'field', key: 'subject', label: 'The thing you are improving', type: 'text', help: 'The product, process or idea the prompts will be applied to.', example: 'The pre-weld check' },
    { kind: 'table', key: 'lenses', label: 'Prompts and ideas', help: 'One row for each prompt; write as many ideas as come.', rowLabel: 'Prompt', fixedRows: ['Substitute', 'Combine', 'Adapt', 'Modify', 'Put to other use', 'Eliminate', 'Reverse'],
      rowHints: { Substitute: 'What could you use instead: a person, a part, a place, a rule?', Combine: 'What could you join together, or do at the same time?', Adapt: 'What else is like this, and what could you borrow from it?', Modify: 'What could you make bigger, smaller, faster or different in form?', 'Put to other use': 'Who else could use this, or what else could it do?', Eliminate: 'What could you remove, simplify or stop doing?', Reverse: 'What if you turned it round, or did the steps in the other order?' },
      columns: [{ key: 'prompt', header: 'Prompt', help: 'The SCAMPER prompt.', type: 'text' }, { key: 'ideas', header: 'Ideas', help: 'Every idea this prompt brings up.', type: 'longtext' }, { key: 'best', header: 'Best idea', help: 'The one worth trying first.', type: 'text' }] },
  ] }],
  derived: [{ key: 'answered', label: 'Prompts with ideas', rule: { op: 'calc', expr: { agg: 'count', table: 'lenses', col: 'ideas' }, format: 'int', suffix: ' of 7' } }],
  outputs: [{ key: 'subject', label: 'The thing improved', rule: { op: 'template', text: '{subject}' } }, { key: 'prompts_answered', label: 'Prompts with ideas', rule: { op: 'calc', expr: { agg: 'count', table: 'lenses', col: 'ideas' }, format: 'int' } }],
  analysisGuide: 'The verdict is the two or three ideas most worth trying. Pick ideas that change how the thing works, not just how it looks; say which prompts gave nothing and whether that is because they do not fit or because they were skipped.',
  sample: { scenario: 'Improving the pre-weld check on Line 2.', values: { subject: 'The pre-weld check' }, tables: { lenses: [
    { prompt: 'Substitute', ideas: 'A flow meter reading instead of a visual look', best: 'Flow meter reading' }, { prompt: 'Combine', ideas: 'Do the gas check while the fixture is loading' },
    { prompt: 'Adapt', ideas: 'Borrow the go/no-go gauge idea from the machining line' }, { prompt: 'Modify', ideas: 'Make the check a one-glance light on the station' },
    { prompt: 'Put to other use', ideas: 'Use the same reading as the shift-start log' }, { prompt: 'Eliminate', ideas: 'Drop the paper tick-sheet' }, { prompt: 'Reverse', ideas: 'Stop the torch from firing until the check passes' } ] } },
};

/** 3. A six-box canvas: six named perspectives, each with its own notes. The canvas diagram is the reference picture. */
export const sixHats: DeclarativeTool = {
  ...base, slug: 'six-perspectives', name: 'Six perspectives review', category: 'creative', stage: 'Decide',
  does: 'Looks at one decision from six separate angles in turn (facts, feelings, caution, benefits, new ideas, process) so the discussion stops going in circles.',
  whenToUse: 'When a team argues past each other about a decision, with some people on the facts, some on the risks and some on the dream.',
  reference: { originator: '', year: '', summary: 'Six coloured viewpoints are taken one at a time by everyone together, so each kind of thinking gets its own time instead of competing.', caption: 'Everyone wears the same hat at the same time.', howToRead: ['State the decision, then take each viewpoint in turn and write what it shows.', 'Finish with the process viewpoint: what was learned and what happens next.'] },
  diagram: { template: 'canvasGrid', title: 'Six perspectives on one decision', cols: 3, rows: 2, boxes: [
    { name: 'White: facts', hint: 'What do we know, and what is missing?', col: 0, row: 0 }, { name: 'Red: feelings', hint: 'What does it feel like, before any reasons?', col: 1, row: 0 }, { name: 'Black: caution', hint: 'What could go wrong?', col: 2, row: 0 },
    { name: 'Yellow: benefits', hint: 'What is good about it?', col: 0, row: 1 }, { name: 'Green: new ideas', hint: 'What else could we do?', col: 1, row: 1 }, { name: 'Blue: process', hint: 'What have we learned; what next?', col: 2, row: 1 } ] },
  sections: [{ key: 'review', title: 'The six perspectives', summary: 'Take them one at a time.', parts: [
    { kind: 'field', key: 'decision', label: 'The decision', type: 'longtext', help: 'The decision under discussion, in one or two sentences.', example: 'Whether to buy a robot welding cell' },
    { kind: 'table', key: 'views', label: 'Notes from each perspective', help: 'Write what each perspective shows about the decision.', rowLabel: 'Perspective', fixedRows: ['White: facts', 'Red: feelings', 'Black: caution', 'Yellow: benefits', 'Green: new ideas', 'Blue: process'],
      columns: [{ key: 'perspective', header: 'Perspective', help: 'The viewpoint.', type: 'text' }, { key: 'notes', header: 'Notes', help: 'What this viewpoint shows.', type: 'longtext' }] },
  ] }],
  derived: [{ key: 'covered', label: 'Perspectives covered', rule: { op: 'calc', expr: { agg: 'count', table: 'views', col: 'notes' }, format: 'int', suffix: ' of 6' } }],
  outputs: [{ key: 'decision', label: 'The decision', rule: { op: 'template', text: '{decision}' } }],
  analysisGuide: 'The verdict is whether the decision is ready to be made. Say which perspectives were thin, where feelings and facts disagree, and which caution is serious enough to change the decision rather than be noted.',
  sample: { scenario: 'Deciding whether to buy a robot welding cell.', values: { decision: 'Whether to buy a robot welding cell for Line 2' }, tables: { views: [
    { perspective: 'White: facts', notes: 'Rework is 5.4% against a 2% target; a cell costs about 18 times the regulator fix.' }, { perspective: 'Red: feelings', notes: 'The night shift would like less repetitive welding; the owner is nervous about the cost.' },
    { perspective: 'Black: caution', notes: 'It would not fix the missing utilities check, which is the cause.' }, { perspective: 'Yellow: benefits', notes: 'Consistent weld quality and a skill the plant can sell.' },
    { perspective: 'Green: new ideas', notes: 'Fix the cause first, then revisit the cell when volumes justify it.' }, { perspective: 'Blue: process', notes: 'Decision deferred; the regulator fix goes ahead this month.' } ] } },
};

const examples: DeclarativeTool[] = [eisenhower, scamper, sixHats];

describe.each(examples.map((t) => [t.slug, t] as const))('%s, written as data', (_slug, tool) => {
  it('passes the quality gate with no blockers', () => {
    const g = qualityGate(tool);
    expect(g.blockers).toEqual([]);
    expect(g.ok).toBe(true);
  });
  it('draws a reference diagram that meets the house rules', () => {
    const svg = renderDiagram(tool.diagram!);
    expect(svg).toContain('viewBox="0 0 720 440"');
    expect(svg).toMatch(/<title id="dg-title">[^<]{4,}<\/title>/);
    expect(svg).toMatch(/<desc id="dg-desc">[^<]{40,}<\/desc>/);
    expect(svg).not.toMatch(/NaN|undefined|\[object/);
    for (const m of svg.matchAll(/font-size="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(9.5);
    expect(renderDiagram(tool.diagram!)).toBe(svg);
  });
  it('runs through the whole engine: saved, read back, put in the Excel template, with its results worked out', () => {
    const def = interpret(tool);
    const s = tool.sample!;
    const values: ModelValues = { fields: { ...s.values }, tables: { ...s.tables } };
    const saved = fieldsFromValues(def, values);
    const back = valuesFromFields(def, saved);
    for (const p of def.sections.flatMap((x) => x.parts)) {
      if (isTable(p)) expect(back.values.tables[p.key] ?? [], p.key).toEqual(cleanTable(p as TablePart, values.tables[p.key]));
      else expect(back.values.fields[p.key] ?? '', p.key).toBe(values.fields[p.key] ?? '');
    }
    const kit = strategyKit({ toolId: def.toolId, name: tool.name, structure: def });
    const tableKey = (def.sections[0].parts.find(isTable) as TablePart).key;
    expect(kit.fromContent(kit.toContent(values), []).tables[tableKey]).toEqual(cleanTable(def.sections[0].parts.find(isTable) as TablePart, values.tables[tableKey]));
    expect(computeDerived(def, values).every((d) => d.value !== null)).toBe(true);
    expect(computeOutputs(def, values).length).toBe(def.outputs.length);
  });
});

describe('what each example shows about its shape', () => {
  it('a tool with no worked example is allowed through with a warning, not blocked', () => {
    const g = qualityGate({ ...sixHats, sample: undefined });
    expect(g.ok).toBe(true);
    expect(g.warnings.join(' ')).toMatch(/No worked example/);
  });
  it('the 2x2 puts the sample tasks in the quadrants a person would expect', () => {
    const t = interpret(eisenhower).sections[0].parts[1] as TablePart;
    const rows = eisenhower.sample!.tables.tasks;
    expect(rows.map((r) => quadrantOf(t, r))).toEqual(['Do first', 'Schedule', 'Hand on', 'Drop']);
    expect(regionList(t, rows)).toEqual([]); // a grid board has no regions
    // the picture and the board name the same four boxes
    const said = renderDiagram(eisenhower.diagram!).toLowerCase();
    for (const q of t.board!.quadrants!) expect(said).toContain(q.name.toLowerCase());
  });
  it('the checklist counts the prompts that have ideas', () => {
    const def = interpret(scamper);
    expect(computeDerived(def, { fields: {}, tables: { lenses: scamper.sample!.tables.lenses } })[0].value).toBe('7 of 7');
    expect(computeDerived(def, { fields: {}, tables: { lenses: [{ prompt: 'Substitute', ideas: 'x' }, { prompt: 'Combine' }] } })[0].value).toBe('1 of 7');
  });
  it('the canvas diagram names the same six perspectives as the table', () => {
    const t = interpret(sixHats).sections[0].parts[1] as TablePart;
    const said = renderDiagram(sixHats.diagram!);
    for (const r of t.fixedRows!) expect(said).toContain(r);
  });
});
