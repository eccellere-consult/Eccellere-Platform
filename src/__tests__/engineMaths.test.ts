import { describe, expect, it } from 'vitest';
import { irrOf, paybackOf, ruleFn, validateDeclarative, type Expr, type Rule } from '@/lib/strategyModels/declarative';

const vals = (fields: Record<string, string> = {}, tables: Record<string, Record<string, string>[]> = {}) => ({ fields, tables }) as never;
const raw = (expr: Expr, v = vals()) => ruleFn({ op: 'calc', expr, format: 'dp2' } as Rule)(undefined, v);
const calc = (expr: Expr, v = vals()) => { const r = raw(expr, v); return r === null ? null : Number(r.replace(/,/g, '')); };

describe('the calculation engine: new functions give textbook answers', () => {
  it('powers, roots, logarithms and exponentials', () => {
    expect(calc({ pow: [2, 10] })).toBe(1024);
    expect(calc({ sqrt: 144 })).toBe(12);
    expect(calc({ ln: { exp: 3 } })).toBe(3);
    expect(calc({ abs: { sub: [3, 10] } })).toBe(7);
    expect(calc({ min: [4, 2, 9] })).toBe(2);
    expect(calc({ max: [4, 2, 9] })).toBe(9);
  });
  it('gives no answer, never a wrong one, for impossible input', () => {
    expect(calc({ sqrt: -4 })).toBeNull();
    expect(calc({ ln: 0 })).toBeNull();
    expect(calc({ div: [1, 0] })).toBeNull();
    expect(calc({ pow: [-8, 0.5] })).toBeNull();
    expect(calc({ sqrt: { field: 'missing' } })).toBeNull();
  });
  it('present value of 1331 in three years at 10% is 1000', () => {
    expect(calc({ div: [1331, { pow: [1.1, 3] }] })).toBe(1000);
  });
});

describe('IRR and payback', () => {
  it('finds exact textbook rates', () => {
    expect(irrOf([-100, 110])).toBeCloseTo(10, 6);
    expect(irrOf([-1000, 0, 0, 1331])).toBeCloseTo(10, 6);
    expect(irrOf([-1000, 500, 500, 500])).toBeCloseTo(23.3752, 3); // 500*annuity(r,3)=1000
  });
  it('has no IRR when the flows never change sign', () => {
    expect(irrOf([100, 200, 300])).toBeNull();
    expect(irrOf([-100, -200])).toBeNull();
  });
  it('interpolates payback inside the year', () => {
    expect(paybackOf([-1000, 400, 400, 400])).toBeCloseTo(2.5, 9);
    expect(paybackOf([-1000, 1000])).toBeCloseTo(1, 9);
    expect(paybackOf([-1000, 100, 100])).toBeNull();
  });
  it('works as rules over a table column', () => {
    const v = vals({}, { cf: [{ y: '0', amt: '-1000' }, { y: '1', amt: '400' }, { y: '2', amt: '400' }, { y: '3', amt: '400' }] });
    expect(ruleFn({ op: 'payback', table: 'cf', col: 'amt' })(undefined, v)).toBe('2.5 years');
    expect(ruleFn({ op: 'irr', table: 'cf', col: 'amt' })(undefined, v)).toMatch(/^9\.7%$/);
    expect(ruleFn({ op: 'payback', table: 'cf', col: 'amt', never: 'Never' })(undefined, vals({}, { cf: [{ amt: '-1000' }, { amt: '10' }] }))).toBe('Never');
  });
});

describe('the quality gate understands the new functions', () => {
  it('rejects a wrong number of values and an unknown column', () => {
    const base = {
      schema: 1, slug: 'maths-test', name: 'Maths test', category: 'analytical', does: 'Checks the maths operations.', whenToUse: 'In a test only.', analysisGuide: 'Read the result against the inputs given.',
      reference: { originator: '', year: '', summary: 'A test tool for the maths.', caption: 'A test caption.', howToRead: ['One', 'Two'] },
      sections: [{ key: 's', title: 'S', summary: 'S', parts: [
        { kind: 'field', key: 'a', label: 'A value', type: 'number', unit: '₹', help: 'Enter the value A.', example: '2' },
        { kind: 'table', key: 'cf', label: 'Cash flows', help: 'One row per year.', rowLabel: 'Year', columns: [{ key: 'y', header: 'Year', help: 'Year number', type: 'text' }, { key: 'amt', header: 'Amount', help: 'Cash in or out', type: 'number', unit: '₹' }] },
      ] }],
      outputs: [{ key: 'o', label: 'Out', rule: { op: 'calc', expr: { pow: [{ field: 'a' }, 2] } } }],
    };
    expect(validateDeclarative(base).filter((i) => i.level === 'error')).toEqual([]);
    const bad = JSON.parse(JSON.stringify(base));
    bad.outputs[0].rule.expr = { pow: [{ field: 'a' }] };
    expect(validateDeclarative(bad).some((i) => /exactly two/.test(i.message))).toBe(true);
    bad.outputs[0].rule = { op: 'irr', table: 'cf', col: 'nope' };
    expect(validateDeclarative(bad).some((i) => /unknown column nope/.test(i.message))).toBe(true);
    bad.outputs[0].rule = { op: 'irr', table: 'cf', col: 'amt' };
    expect(validateDeclarative(bad).filter((i) => i.level === 'error')).toEqual([]);
  });
});
