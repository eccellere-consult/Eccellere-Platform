// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createMemoryRepo } from '@/lib/tools/memoryRepo';
import { installPilots, PILOTS, pilotByAgent } from '@/lib/agents/pilots';
import { inputsOf, outputsOf } from '@/lib/agents/sipoc';
import { everyAgent } from '@/lib/agents/catalogue';

describe('installPilots', () => {
  it('adds the pilots as needs-review, hand-built, and never publishes', async () => {
    const repo = createMemoryRepo();
    const r = await installPilots(repo, () => new Date('2026-11-08T00:00:00Z'));
    expect(r.added.sort()).toEqual(['attendance-payroll-reconciler', 'capital-allocation-advisor', 'caro-compliance-checker', 'close-the-books-agent', 'collections-follow-up-agent', 'concept-screener', 'demand-forecaster', 'distributor-health-check', 'exit-interview-analyzer', 'fleet-utilisation', 'hire-to-onboard-agent', 'lane-profitability', 'lead-to-quote-assistant', 'maintenance-priority-ranker', 'mis-report-generator', 'oee-calculator', 'otif-tracker', 'po-invoice-matcher', 'pricing-optimizer', 'product-spec-generator', 'production-scheduler', 'project-margin-forecast', 'scenario-planner', 'scrap-yield-analyzer', 'shrinkage-tracker', 'sku-rationalisation', 'sla-breach-tracker', 'stock-cover-markdown-planner', 'store-performance-scorecard', 'strategy-plan-cascade', 'supplier-risk-monitor', 'trade-promotion-roi', 'utilisation-bench', 'vendor-onboarding-agent', 'voice-of-customer-synthesizer', 'warehouse-productivity']);
    expect(r.refused).toEqual([]);
    for (const slug of r.added) {
      const t = (await repo.getToolBySlug(slug))!;
      expect(t.status).toBe('NEEDS_REVIEW');
      expect(t.source).toBe('hand');
      expect(t.publishedAt).toBeNull();
      expect(t.quality?.errors).toEqual([]);
    }
  });
  it('is safe to press twice and leaves an edited tool alone', async () => {
    const repo = createMemoryRepo();
    await installPilots(repo);
    const again = await installPilots(repo);
    expect(again.added).toEqual([]);
    expect(again.skipped).toHaveLength(36);
  });
});

describe('pilots and the catalogue', () => {
  it('every pilot is an agent in the catalogue with the same slug', () => {
    const slugs = new Set(everyAgent().map((a) => a.slug));
    for (const p of PILOTS) { expect(slugs.has(p.agent)).toBe(true); expect(p.tool.slug).toBe(p.agent); expect(pilotByAgent(p.agent)).toBe(p); }
  });
  it('every pilot has a complete SIPOC and derives its inputs and outputs from the tool', () => {
    for (const p of PILOTS) {
      expect(p.sipoc.suppliers.length).toBeGreaterThan(0);
      expect(p.sipoc.process.length).toBeGreaterThanOrEqual(4);
      expect(p.sipoc.customers.length).toBeGreaterThan(0);
      expect(p.sipoc.refresh.length).toBeGreaterThan(10);
      expect(inputsOf(p.tool).length).toBeGreaterThan(3);
      expect(outputsOf(p.tool).filter((o) => o.kind === 'result').length).toBeGreaterThan(0);
    }
  });
});
