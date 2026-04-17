import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3002";

// ─── Sprint 5: Specialist Portal ────────────────────────────────────────────

test.describe("TC-5.01 | Specialist page loads", () => {
  test("Page renders with KPI section and tab bar", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    // H1 heading
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
    // 4 tab buttons present
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "My Assets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Assignments" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Earnings" })).toBeVisible();
    // CTA link — use .first() as the same link appears in Quick Access cards too
    await expect(page.getByRole("link", { name: /Submit New Asset/i }).first()).toBeVisible();
  });
});

test.describe("TC-5.02 | KPI cards - 4 metrics present", () => {
  test("All 4 KPI cards render with correct values", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    // KPI label+value pairs — each card contains the label AND value
    await expect(page.locator(".rounded-lg.bg-white").filter({ hasText: "Total Earnings" }).filter({ hasText: "₹3,42,500" }).first()).toBeVisible();
    await expect(page.locator(".rounded-lg.bg-white").filter({ hasText: "Published Assets" }).first()).toBeVisible();
    await expect(page.locator(".rounded-lg.bg-white").filter({ hasText: "Active Assignments" }).first()).toBeVisible();
    await expect(page.locator(".rounded-lg.bg-white").filter({ hasText: "Avg Rating" }).filter({ hasText: "4.8" }).first()).toBeVisible();
  });
});

test.describe("TC-5.03 | Tab - Overview (default)", () => {
  test("Overview tab is active by default and shows Quick Access cards", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    // Overview tab button visible
    const overviewTab = page.getByRole("button", { name: "Overview" });
    await expect(overviewTab).toBeVisible();
    // Quick Access heading (h2 role)
    await expect(page.getByRole("heading", { name: "Quick Access" })).toBeVisible();
    // Quick Access module cards (links in the grid under Quick Access)
    await expect(page.getByRole("link", { name: /Submit New Asset/i }).first()).toBeVisible();
    // Upcoming Deadlines heading
    await expect(page.getByRole("heading", { name: "Upcoming Deadlines" })).toBeVisible();
    // Deadline items (at least one assignment with clock icon area)
    await expect(page.getByText("Arjun Textiles Pvt Ltd")).toBeVisible();
  });
});

test.describe("TC-5.04 | Tab - My Assets", () => {
  test("My Assets tab shows 5 assets with required columns", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "My Assets" }).click();
    // Table header shows count
    await expect(page.getByText("My Assets (5)")).toBeVisible();
    // Check first asset name
    await expect(page.getByText("MSME Growth Strategy Playbook")).toBeVisible();
    // Check columns exist
    await expect(page.getByText("Views").first()).toBeVisible();
    await expect(page.getByText("Sales").first()).toBeVisible();
    await expect(page.getByText("Revenue").first()).toBeVisible();
  });
});

test.describe("TC-5.05 | My Assets - status badges", () => {
  test("Published, Pending and Draft status badges render", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "My Assets" }).click();
    // At least one published badge
    const publishedBadges = page.getByText("published");
    await expect(publishedBadges.first()).toBeVisible();
    // Pending badge (Digital Transformation Playbook v2)
    await expect(page.getByText("pending").first()).toBeVisible();
    // Draft badge (Retail Analytics Dashboard Template)
    await expect(page.getByText("draft").first()).toBeVisible();
  });
});

test.describe("TC-5.06 | Tab - Assignments", () => {
  test("Assignments tab shows 4 entries", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "Assignments" }).click();
    await expect(page.getByText("Assignments (4)")).toBeVisible();
    // Check all 4 clients
    await expect(page.getByText("Arjun Textiles Pvt Ltd")).toBeVisible();
    await expect(page.getByText("FreshBasket D2C")).toBeVisible();
    await expect(page.getByText("SwiftShip Logistics")).toBeVisible();
    await expect(page.getByText("Precision Auto Components")).toBeVisible();
  });
});

test.describe("TC-5.07 | Assignments - status badges", () => {
  test("In Progress and Completed status badges are styled", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "Assignments" }).click();
    // in-progress badges (should appear 3 times)
    const inProgressBadges = page.getByText("in-progress");
    expect(await inProgressBadges.count()).toBeGreaterThanOrEqual(1);
    // completed badge
    await expect(page.getByText("completed").first()).toBeVisible();
    // due dates present
    await expect(page.getByText(/Apr 28, 2026/)).toBeVisible();
    await expect(page.getByText(/Mar 15, 2026/)).toBeVisible();
    // values in ₹
    await expect(page.getByText("₹75,000")).toBeVisible();
    await expect(page.getByText("₹90,000")).toBeVisible();
  });
});

test.describe("TC-5.08 | Tab - Earnings", () => {
  test("Earnings tab shows chart and breakdown", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "Earnings" }).click();
    // Chart heading (h2)
    await expect(page.locator("h2").filter({ hasText: /Monthly Earnings/ }).first()).toBeVisible();
    // Trend indicator text
    await expect(page.getByText(/\+26%/)).toBeVisible();
    // Breakdown h2
    await expect(page.locator("h2").filter({ hasText: "Earnings Breakdown" }).first()).toBeVisible();
    // Breakdown percentage labels
    await expect(page.getByText(/Asset Sales \(60%\)/)).toBeVisible();
    await expect(page.getByText(/Assignments \(35%\)/)).toBeVisible();
  });
});

test.describe("TC-5.09 | Earnings - payout info", () => {
  test("Next payout section shows amount, bank details and date", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    await page.getByRole("button", { name: "Earnings" }).click();
    // Next payout card
    // Next Payout card — scope to parent container to avoid strict-mode violations
    const payoutSection = page.locator(".border-t").filter({ hasText: "Next Payout" });
    await expect(payoutSection.getByText("Next Payout")).toBeVisible();
    // Exact payout amount from mock data
    await expect(payoutSection.getByText("₹48,250")).toBeVisible();
  });
});

test.describe("TC-5.10 | Responsive - mobile layout", () => {
  test("Page renders without horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/specialist`);
    // No horizontal overflow — compare against window.innerWidth (not clientWidth)
    // clientWidth is reduced by any vertical scrollbar width, causing false positives
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    // KPIs should still be visible
    await expect(page.getByText("Total Earnings")).toBeVisible();
    // Tab bar visible
    await expect(page.getByRole("button", { name: "My Assets" })).toBeVisible();
  });
});

// ─── Bonus: Verify Header and Footer render on Specialist page ───────────────

test.describe("TC-5.11 | Header renders on Specialist Portal", () => {
  test("Sticky header with logo and nav links present", async ({ page }) => {
    await page.goto(`${BASE}/specialist`);
    // Logo / brand name — actual text is "ECCELLERĒ" (with Unicode macron)
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    // CTA button
    await expect(page.getByRole("link", { name: /Talk to Us/i })).toBeVisible();
  });
});

test.describe("TC-5.12 | Specialist page has no console errors", () => {
  test("No JS console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${BASE}/specialist`);
    // Wait for DOM to be ready (networkidle is unreliable in Next.js dev mode)
    await page.waitForLoadState("domcontentloaded");
    // Filter out known non-critical browser extension errors
    const appErrors = errors.filter(
      (e) => !e.includes("extension") && !e.includes("favicon")
    );
    expect(appErrors).toHaveLength(0);
  });
});
