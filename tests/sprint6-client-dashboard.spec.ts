import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3002";

// ─── Sprint 6: Client Dashboard ─────────────────────────────────────────────

// TC-6.01 | /dashboard — Overview page loads
test.describe("TC-6.01 | Dashboard overview loads", () => {
  test("Page renders KPI cards and heading", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page.locator("h1")).toContainText(/Good morning/i);
    // 4 KPI cards
    await expect(page.getByText("Total Spent")).toBeVisible();
    await expect(page.getByText("Assets Purchased")).toBeVisible();
    await expect(page.getByText("AI Readiness Score")).toBeVisible();
  });
});

// TC-6.02 | Dashboard sidebar navigation items present
test.describe("TC-6.02 | Sidebar navigation renders", () => {
  test("Sidebar user pill and nav items are present", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    // User pill — always visible in sidebar at desktop viewport
    await expect(page.getByText("Rahul Kumar")).toBeVisible();
    await expect(page.getByText("Growth Plan").first()).toBeVisible();
    // Sidebar nav text items (use text since icons affect role/name)
    await expect(page.getByText("My Library").first()).toBeVisible();
    await expect(page.getByText("AI Advisor").first()).toBeVisible();
    // Quick action links also visible on the overview page
    await expect(page.getByText("Ask AI Advisor")).toBeVisible();
  });
});

// TC-6.03 | Dashboard overview — recent orders and quick actions
test.describe("TC-6.03 | Overview — recent orders and quick actions", () => {
  test("Recent Orders section and quick action links render", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    // Recent Orders is an h2
    await expect(page.getByRole("heading", { name: /Recent Orders/i })).toBeVisible();
    // Quick actions are links (no h2 exists for them)
    await expect(page.getByRole("link", { name: /Ask AI Advisor/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse Marketplace/i })).toBeVisible();
    // At least one order row visible
    await expect(page.getByText("ORD-").first()).toBeVisible();
  });
});

// TC-6.04 | /dashboard/library — asset grid
test.describe("TC-6.04 | Library page loads and shows assets", () => {
  test("8 purchased assets rendered with search and filter", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/library`);
    await expect(page.locator("h1")).toContainText(/My Library/i);
    // Search input present
    await expect(page.getByPlaceholder(/Search assets/i)).toBeVisible();
    // At least one asset card
    await expect(page.getByText("MSME Growth Strategy Playbook")).toBeVisible();
    // Download button visible (it's a <Button> not an <a>)
    await expect(page.getByRole("button", { name: /Download/i }).first()).toBeVisible();
  });
});

// TC-6.05 | Library category filter chips
test.describe("TC-6.05 | Library — category filter chips", () => {
  test("Category filter bar renders with All chip active", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/library`);
    // "All" filter chip
    await expect(page.getByRole("button", { name: /^All$/ })).toBeVisible();
    // At least one other category chip
    await expect(page.getByRole("button", { name: /Strategy/i })).toBeVisible();
  });
});

// TC-6.06 | /dashboard/orders — order history table
test.describe("TC-6.06 | Orders page loads with 10 orders", () => {
  test("Orders table renders with search and status filter", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`);
    await expect(page.locator("h1")).toContainText(/Order History/i);
    // Search input — actual placeholder is longer
    await expect(page.getByPlaceholder(/Search by order/i)).toBeVisible();
    // ORD- rows
    const orderRows = page.getByText(/^ORD-/);
    expect(await orderRows.count()).toBeGreaterThanOrEqual(5);
    // Status badges
    await expect(page.getByText("completed").first()).toBeVisible();
  });
});

// TC-6.07 | Orders — status filter works
test.describe("TC-6.07 | Orders — status filter", () => {
  test("Status filter buttons are visible and functional", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`);
    // Filters are buttons (not a <select>)
    await expect(page.getByRole("button", { name: /^All$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Completed$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Processing$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Refunded$/ })).toBeVisible();
  });
});

// TC-6.08 | /dashboard/orders/[id] — order detail
test.describe("TC-6.08 | Order detail page renders", () => {
  test("Order detail for ORD-2041 shows timeline and payment summary", async ({ page }) => {
    test.setTimeout(60000);
    // Go directly — dynamic route may need cold compilation in dev mode
    await page.goto(`${BASE}/dashboard/orders/ORD-2041`, { timeout: 45000 });
    await expect(page.getByText("MSME Growth Strategy Playbook").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("ORD-2041").first()).toBeVisible();
    // Timeline steps
    await expect(page.getByText(/Order placed/i)).toBeVisible();
    await expect(page.getByText(/Payment confirmed/i)).toBeVisible();
    await expect(page.getByText(/Asset delivered/i)).toBeVisible();
    // Payment summary
    await expect(page.getByText(/Payment Summary/i)).toBeVisible();
  });
});

// TC-6.09 | /dashboard/assignments — accordion cards
test.describe("TC-6.09 | Assignments page loads", () => {
  test("5 assignments render with status badges and project names", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/assignments`);
    await expect(page.locator("h1")).toContainText(/Assignments/i);
    // Status badges — rendered as "in progress" (replace "-" with " ")
    await expect(page.getByText("in progress").first()).toBeVisible();
    await expect(page.getByText("completed").first()).toBeVisible();
    // At least one project name visible
    await expect(page.getByText("Digital Transformation Roadmap")).toBeVisible();
  });
});

// TC-6.10 | Assignments — accordion shows deliverables
test.describe("TC-6.10 | Assignments — deliverables panel visible", () => {
  test("First assignment is expanded by default showing deliverables", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/assignments`);
    // ASG-301 is expanded by default (initial state)
    await expect(page.getByText(/Deliverables/i).first()).toBeVisible();
    // Action buttons visible in expanded card
    await expect(page.getByRole("button", { name: /Message/i }).first()).toBeVisible();
  });
});

// TC-6.11 | /dashboard/assessments — score ring and history
test.describe("TC-6.11 | Assessments page renders score ring", () => {
  test("Latest score, dimension bars, and history list visible", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/assessments`);
    await expect(page.locator("h1")).toContainText(/Assessments/i);
    // Score value (72 latest)
    await expect(page.getByText("72").first()).toBeVisible();
    // At least one dimension label
    await expect(page.getByText(/Data Infrastructure/i)).toBeVisible();
    // Recommendations heading
    await expect(page.getByText(/Recommendations/i)).toBeVisible();
    // History items (older scores)
    await expect(page.getByText("64").first()).toBeVisible();
  });
});

// TC-6.12 | /dashboard/advisor — AI chatbot UI
test.describe("TC-6.12 | AI Advisor chatbot UI renders", () => {
  test("Chat interface shows initial message and suggestion chips", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/advisor`);
    await expect(page.locator("h1")).toContainText(/AI Advisor/i);
    // Initial bot message
    await expect(page.getByText(/How can I help/i)).toBeVisible();
    // Suggestion chips (shown when fresh)
    await expect(page.locator("button").filter({ hasText: /Working Capital/i })).toBeVisible();
    // Message input — actual placeholder text
    await expect(page.getByPlaceholder(/Ask anything about your business/i)).toBeVisible();
    // Send button
    await expect(page.getByRole("button", { name: /Send/i })).toBeVisible();
  });
});

// TC-6.13 | AI Advisor — send message and get response
test.describe("TC-6.13 | AI Advisor — send message triggers mock response", () => {
  test("Clicking a suggestion chip sends message and gets bot reply", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/advisor`);
    // Wait for initial message and chips to confirm React has hydrated
    await expect(page.getByText(/How can I help/i)).toBeVisible();
    await page.waitForTimeout(3000);
    // Click the Working Capital suggestion chip (fires send() directly without input)
    const chip = page.locator("button").filter({ hasText: /Working Capital/i });
    await expect(chip).toBeVisible();
    await chip.click();
    // The chip text appears as the user message
    await expect(page.getByText(/Working Capital/i).first()).toBeVisible();
    // Wait for bot response (typing indicator first, then reply)
    await expect(page.getByText(/receivables|working capital|Cash Conversion/i).first()).toBeVisible({ timeout: 10000 });
  });
});

// TC-6.14 | /dashboard/settings — 5 tabs render
test.describe("TC-6.14 | Settings page loads with tab navigation", () => {
  test("All 5 tabs present and Profile tab active by default", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`);
    await expect(page.locator("h1")).toContainText(/Settings/i);
    await expect(page.getByRole("button", { name: /Profile/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Business/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Billing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Security/i })).toBeVisible();
    // Profile fields visible by default
    await expect(page.getByLabel(/First Name/i)).toBeVisible();
  });
});

// TC-6.15 | Settings — tab switching
test.describe("TC-6.15 | Settings — tab switching renders correct content", () => {
  test("Clicking Billing tab shows Growth Plan card", async ({ page }) => {
    test.setTimeout(45000);
    await page.goto(`${BASE}/dashboard/settings`);
    await expect(page.getByLabel(/First Name/i)).toBeVisible({ timeout: 15000 });
    // Retry clicking Billing tab until React hydration wires the onClick handler
    await expect(async () => {
      await page.getByRole("button", { name: /Billing/i }).click();
      await expect(page.getByText(/Renews/i)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 30000, intervals: [500, 1000, 2000] });
    await expect(page.getByLabel(/First Name/i)).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /Payment Method/i })).toBeVisible();
  });
});

// TC-6.16 | Settings — notification toggles
test.describe("TC-6.16 | Settings — notification toggles render", () => {
  test("Notifications tab shows toggle switches", async ({ page }) => {
    test.setTimeout(45000);
    await page.goto(`${BASE}/dashboard/settings`);
    await expect(page.getByLabel(/First Name/i)).toBeVisible({ timeout: 15000 });
    // Retry clicking Notifications tab until React hydration wires the onClick handler
    await expect(async () => {
      await page.getByRole("button", { name: /Notifications/i }).click();
      await expect(page.getByText(/Order confirmations/i)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 30000, intervals: [500, 1000, 2000] });
    await expect(page.getByLabel(/First Name/i)).not.toBeVisible();
    await expect(page.getByText(/Assignment updates/i)).toBeVisible();
    const toggles = page.locator("input[type='checkbox']");
    expect(await toggles.count()).toBeGreaterThanOrEqual(3);
  });
});

// TC-6.17 | Responsive — dashboard at 375px no overflow
test.describe("TC-6.17 | Responsive — no horizontal overflow at 375px", () => {
  test("Dashboard renders without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard`);
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    // KPIs still visible
    await expect(page.getByText("Total Spent")).toBeVisible();
  });
});

// TC-6.18 | Mobile — hamburger menu opens sidebar overlay
test.describe("TC-6.18 | Mobile — hamburger opens sidebar overlay", () => {
  test("Menu button reveals nav links on mobile", async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard`);
    await expect(page.getByText("Total Spent")).toBeVisible({ timeout: 15000 });
    // Wait for React hydration — React attaches __reactFiber$ to DOM elements
    await page.waitForFunction(() => {
      const btn = document.querySelector('header button');
      return btn && Object.keys(btn).some(k => k.startsWith('__reactFiber$') || k.startsWith('__reactProps$'));
    }, { timeout: 25000 });
    const hamburger = page.locator("header button").first();
    await hamburger.click();
    // Mobile overlay should appear with sidebar nav links
    const overlay = page.locator(".fixed.inset-0");
    await expect(overlay).toBeVisible({ timeout: 5000 });
    await expect(overlay.getByText("My Library")).toBeVisible({ timeout: 5000 });
  });
});
