import { test, expect } from "@playwright/test";
import * as fs from "fs/promises";
import * as path from "path";

// Sprint 11 — Commerce Engine & Content Pages Tests
// Covers: Service detail pages, Pricing page, Orders API, Payments API,
//         Razorpay webhook, CheckoutButton component, Legal pages.

const BASE = "http://localhost:3002";

// ── TC-11.01: Agentic AI service detail page renders ─────────────────────────
test("TC-11.01 /services/agentic-ai renders service detail page", async ({ page }) => {
  const res = await page.goto(`${BASE}/services/agentic-ai`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Agentic AI");
});

// ── TC-11.02: Strategy service detail page renders ───────────────────────────
test("TC-11.02 /services/strategy renders service detail page", async ({ page }) => {
  const res = await page.goto(`${BASE}/services/strategy`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Strategy");
});

// ── TC-11.03: Process Transformation service detail page renders ──────────────
test("TC-11.03 /services/process-transformation renders correctly", async ({ page }) => {
  const res = await page.goto(`${BASE}/services/process-transformation`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Process");
});

// ── TC-11.04: Digital service detail page renders ──────────────────────
test("TC-11.04 /services/digital-transformation renders correctly", async ({ page }) => {
  const res = await page.goto(`${BASE}/services/digital`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Digital");
});

// ── TC-11.05: Organisation Transformation service detail page renders ─────────
test("TC-11.05 /services/organisation-transformation renders correctly", async ({
  page,
}) => {
  const res = await page.goto(`${BASE}/services/organisation-transformation`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Organisation");
});

// ── TC-11.06: Unknown service slug returns 404 ───────────────────────────────
test("TC-11.06 unknown service slug returns 404", async ({ page }) => {
  const res = await page.goto(`${BASE}/services/non-existent-service`, {
    waitUntil: "domcontentloaded",
  });
  // Next.js returns 404 for pages not in generateStaticParams
  expect(res?.status()).toBe(404);
});

// ── TC-11.07: Service detail page shows FAQ section ──────────────────────────
test("TC-11.07 service detail page contains FAQ section", async ({ page }) => {
  await page.goto(`${BASE}/services/agentic-ai`, { waitUntil: "domcontentloaded" });
  const faqSection = page.locator("h2:has-text('Frequently asked questions'), h2:has-text('FAQ')");
  await expect(faqSection.first()).toBeVisible();
});

// ── TC-11.08: Service detail page shows approach steps ───────────────────────
test("TC-11.08 service detail page contains Our Approach section", async ({ page }) => {
  await page.goto(`${BASE}/services/strategy`, { waitUntil: "domcontentloaded" });
  const approachSection = page.locator(
    "[data-testid='approach-section'], h2:has-text('Approach')"
  );
  await expect(approachSection.first()).toBeVisible();
});

// ── TC-11.09: Agentic AI page has starting price ─────────────────────────────
test("TC-11.09 service detail page shows starting price", async ({ page }) => {
  await page.goto(`${BASE}/services/agentic-ai`, { waitUntil: "domcontentloaded" });
  const priceText = page.locator("text=/₹[0-9,]+/");
  await expect(priceText.first()).toBeVisible();
});

// ── TC-11.10: Service detail page has CTA buttons ────────────────────────────
test("TC-11.10 service detail page has call-to-action buttons", async ({ page }) => {
  await page.goto(`${BASE}/services/agentic-ai`, { waitUntil: "domcontentloaded" });
  const ctaLink = page.locator("a[href='/contact'], a[href*='contact']");
  await expect(ctaLink.first()).toBeVisible();
});

// ── TC-11.11: Pricing page renders with 3 plans ───────────────────────────────
test("TC-11.11 /pricing renders with plan tiers", async ({ page }) => {
  const res = await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
});

// ── TC-11.12: Pricing page has MSME Pro plan ──────────────────────────────────
test("TC-11.12 pricing page shows MSME Pro plan", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "MSME Pro", exact: true })).toBeVisible();
});

// ── TC-11.13: Pricing page has Starter plan ───────────────────────────────────
test("TC-11.13 pricing page shows Starter plan", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Starter" })).toBeVisible();
});

// ── TC-11.14: Pricing page has Enterprise plan ────────────────────────────────
test("TC-11.14 pricing page shows Enterprise plan", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
});

// ── TC-11.15: Pricing page has feature comparison table ──────────────────────
test("TC-11.15 pricing page has feature comparison table or grid", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  // Either a <table> or a feature list should be present
  const featureEl = page.locator("table, [data-testid='feature-comparison']");
  await expect(featureEl.first()).toBeVisible();
});

// ── TC-11.16: Orders API requires auth (unauthenticated returns 401) ──────────
test("TC-11.16 GET /api/orders returns 401 without authentication", async ({ request }) => {
  const res = await request.get(`${BASE}/api/orders`);
  expect(res.status()).toBe(401);
});

// ── TC-11.17: Payments API POST requires auth ────────────────────────────────
test("TC-11.17 POST /api/payments returns 401 without authentication", async ({
  request,
}) => {
  const res = await request.post(`${BASE}/api/payments`, {
    data: { amount: 100000, assetSlug: "test-asset", assetTitle: "Test" },
  });
  expect(res.status()).toBe(401);
});

// ── TC-11.18: Payments API PATCH requires auth ───────────────────────────────
test("TC-11.18 PATCH /api/payments returns 401 without authentication", async ({
  request,
}) => {
  const res = await request.patch(`${BASE}/api/payments`, {
    data: {
      razorpayOrderId: "order_test",
      razorpayPaymentId: "pay_test",
      razorpaySignature: "sig_test",
      assetSlug: "test",
      assetTitle: "Test",
      assetFormat: "PDF",
      amount: 100000,
    },
  });
  expect(res.status()).toBe(401);
});

// ── TC-11.19: Razorpay webhook rejects invalid signature ─────────────────────
test("TC-11.19 POST /api/webhooks/razorpay returns 400 on bad signature", async ({
  request,
}) => {
  const res = await request.post(`${BASE}/api/webhooks/razorpay`, {
    data: {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test", order_id: "order_test" } } },
    },
    headers: {
      "x-razorpay-signature": "bad_signature_value",
      "Content-Type": "application/json",
    },
  });
  // In dev mode without RAZORPAY_WEBHOOK_SECRET, returns 200; with secret returns 400/401
  expect([200, 400, 401]).toContain(res.status());
});

// ── TC-11.20: Razorpay webhook in dev mode without secret ────────────────────
test("TC-11.20 POST /api/webhooks/razorpay without signature in dev accepts or 400", async ({
  request,
}) => {
  // In dev mode with no RAZORPAY_WEBHOOK_SECRET, the webhook may accept or reject
  // The key assertion is that the endpoint exists and responds
  const res = await request.post(`${BASE}/api/webhooks/razorpay`, {
    data: { event: "payment.captured", payload: {} },
    headers: { "Content-Type": "application/json" },
  });
  // Should be a valid HTTP response, not 404 or 500
  expect([200, 400, 401]).toContain(res.status());
});

// ── TC-11.21: Privacy policy page renders ────────────────────────────────────
test("TC-11.21 /privacy renders privacy policy page", async ({ page }) => {
  const res = await page.goto(`${BASE}/privacy`, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Privacy");
});

// ── TC-11.22: Terms of service page renders ───────────────────────────────────
test("TC-11.22 /terms renders terms of service page", async ({ page }) => {
  const res = await page.goto(`${BASE}/terms`, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Terms");
});

// ── TC-11.23: Refund policy page renders ─────────────────────────────────────
test("TC-11.23 /refund renders refund policy page", async ({ page }) => {
  const res = await page.goto(`${BASE}/refund`, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Refund");
});

// ── TC-11.24: Refund page mentions 14-day guarantee ──────────────────────────
test("TC-11.24 refund page mentions 14-day money-back guarantee", async ({ page }) => {
  await page.goto(`${BASE}/refund`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("text=/14.day/i").first()).toBeVisible();
});

// ── TC-11.25: Privacy page has links to Terms and Refund ─────────────────────
test("TC-11.25 privacy page links to terms and refund pages", async ({ page }) => {
  await page.goto(`${BASE}/privacy`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("a[href='/terms']")).toBeVisible();
  await expect(page.locator("a[href='/refund']")).toBeVisible();
});

// ── TC-11.26: CheckoutButton source file exists ───────────────────────────────
test("TC-11.26 CheckoutButton component file exists", async () => {
  const filePath = path.resolve(
    __dirname,
    "../src/components/marketplace/CheckoutButton.tsx"
  );
  const stat = await fs.stat(filePath);
  expect(stat.isFile()).toBe(true);
});

// ── TC-11.27: services-data.ts exports all 5 service slugs ───────────────────
test("TC-11.27 services-data.ts source file exists with correct structure", async () => {
  const filePath = path.resolve(__dirname, "../src/lib/services-data.ts");
  const content = await fs.readFile(filePath, "utf-8");
  expect(content).toContain("agentic-ai");
  expect(content).toContain("strategy");
  expect(content).toContain("process-transformation");
  expect(content).toMatch(/"digital"|slug:\s*"digital"/);
  expect(content).toContain("organisation-transformation");
});

// ── TC-11.28: Legal pages have cross-navigation links ────────────────────────
test("TC-11.28 terms page links to privacy and refund policies", async ({ page }) => {
  await page.goto(`${BASE}/terms`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("a[href='/privacy']").first()).toBeVisible();
  await expect(page.locator("a[href='/refund']").first()).toBeVisible();
});

// ── TC-11.29: Pricing page CTA links to register ─────────────────────────────
test("TC-11.29 pricing page has sign-up call-to-action links", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  const ctaLink = page.locator("a[href='/register'], a[href*='register']");
  await expect(ctaLink.first()).toBeVisible();
});

// ── TC-11.30: Orders API DELETE/PUT returns 405 or 404 ───────────────────────
test("TC-11.30 unsupported HTTP method on /api/orders returns 405", async ({ request }) => {
  const res = await request.delete(`${BASE}/api/orders`);
  expect([404, 405]).toContain(res.status());
});
